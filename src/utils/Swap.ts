import { Address, Bytes, BigInt, BigDecimal } from '@graphprotocol/graph-ts'
import { Swap, Token, User } from '../../generated/schema'
import { createAndReturnUser } from './User'
import { WRBTCAddress } from '../contracts/contracts'
import { updateLastPriceUsdAll } from './Prices'
import { decimal, DEFAULT_DECIMALS } from '@protofire/subgraph-toolkit'
import { handleCandlesticks } from './Candlesticks'
import { createAndReturnProtocolStats, createAndReturnUserTotals } from './ProtocolStats'
import { getTokenPriceConversions } from './Prices'

export class ConversionEventForSwap {
  transactionHash: Bytes
  fromToken: Address
  toToken: Address
  fromAmount: BigDecimal
  toAmount: BigDecimal
  timestamp: BigInt
  user: Address
  trader: Address
  lpFee: BigDecimal
  protocolFee: BigDecimal
}

export function createAndReturnSwap(event: ConversionEventForSwap): Swap {
  let userEntity: User | null = null
  /** Check if the trader property on the swap is the same as the caller of the tx. If it is, this is a user-instigated swap */
  if (event.user.toHexString() == event.trader.toHexString()) {
    userEntity = createAndReturnUser(event.user)
  }
  let swapEntity = Swap.load(event.transactionHash.toHex())

  /** Create swap  */
  if (swapEntity == null) {
    swapEntity = new Swap(event.transactionHash.toHexString())
    swapEntity.numConversions = 1
    swapEntity.fromToken = event.fromToken.toHexString()
    swapEntity.toToken = event.toToken.toHexString()
    swapEntity.fromAmount = event.fromAmount
    swapEntity.toAmount = event.toAmount
    swapEntity.rate = event.fromAmount.div(event.toAmount).truncate(8)
    if (userEntity != null) {
      swapEntity.user = userEntity.id
      userEntity.save()
    }
    swapEntity.isMarginTrade = false
    swapEntity.isBorrow = false
    swapEntity.timestamp = event.timestamp
  } else {
    /** Swap already exists - this means it has multiple conversion events */
    swapEntity.numConversions += 1
    swapEntity.toToken = event.toToken.toHexString()
    swapEntity.toAmount = event.toAmount
    swapEntity.rate = swapEntity.fromAmount.div(event.toAmount).truncate(8)
  }
  swapEntity.save()

  return swapEntity
}

export function updatePricingAndCandlesticks(event: ConversionEventForSwap): void {
  /** This threshold is set so that the last traded price is not skewed by rounding errors */
  const threshold = decimal.fromNumber(0.00000001)
  if (event.fromAmount < threshold || event.toAmount < threshold) {
    return
  }
  let protocolStatsEntity = createAndReturnProtocolStats()
  const USDTAddress = protocolStatsEntity.usdStablecoin.toLowerCase()
  let btcUsdPrice = protocolStatsEntity.btcUsdPrice

  let BTCToken = Token.load(WRBTCAddress.toLowerCase())

  if (BTCToken != null) {
    let token: Token | null
    let tokenAmount: BigDecimal
    let btcAmount: BigDecimal

    if (event.fromToken.toHexString().toLowerCase() == WRBTCAddress.toLowerCase()) {
      token = Token.load(event.toToken.toHexString())
      tokenAmount = event.toAmount
      btcAmount = event.fromAmount
    } else if (event.toToken.toHexString().toLowerCase() == WRBTCAddress.toLowerCase()) {
      token = Token.load(event.fromToken.toHexString())
      tokenAmount = event.fromAmount
      btcAmount = event.toAmount
    } else {
      /** TODO: Handle case where neither token is rBTC for when AMM pools with non-rBTC tokens are introduced */
    }

    /** IF SWAP IS BTC/USDT: Update lastPriceUsd on BTC */

    if (event.fromToken.toHexString().toLowerCase() == USDTAddress.toLowerCase() || event.toToken.toHexString().toLowerCase() == USDTAddress.toLowerCase()) {
      btcUsdPrice = tokenAmount.div(btcAmount)
      protocolStatsEntity.btcUsdPrice = btcUsdPrice
      protocolStatsEntity.save()
      BTCToken.lastPriceUsd = btcUsdPrice.truncate(18)
      BTCToken.lastPriceBtc = decimal.ONE
      updateLastPriceUsdAll(event.timestamp)
    }

    if (token != null) {
      const oldPriceBtc = token.lastPriceBtc
      const newPriceBtc = btcAmount.div(tokenAmount).truncate(18)
      const btcVolume = btcAmount.truncate(18)
      const newPriceUsd = newPriceBtc.times(btcUsdPrice).truncate(18) // THIS WAS THE BUG

      const oldPriceUsd = token.lastPriceUsd.truncate(18)
      if (token.lastPriceUsd.gt(BigDecimal.zero())) {
        token.lastPriceUsd = newPriceUsd
      }
      const usdVolume = btcAmount.times(btcUsdPrice).truncate(18)

      token.lastPriceBtc = newPriceBtc
      token.btcVolume = token.btcVolume.plus(btcVolume).truncate(18)
      token.tokenVolume = token.tokenVolume.plus(tokenAmount).truncate(18)

      BTCToken.btcVolume = BTCToken.btcVolume.plus(btcVolume).truncate(18)
      BTCToken.tokenVolume = BTCToken.btcVolume.plus(btcVolume).truncate(18)

      /** Update BTC Candlesticks for token */
      handleCandlesticks({
        tradingPair: token.id.toLowerCase() + '_' + WRBTCAddress.toLowerCase(),
        blockTimestamp: event.timestamp,
        oldPrice: oldPriceBtc,
        newPrice: newPriceBtc,
        volume: btcVolume,
      })

      let lpFeeUsd = newPriceUsd.times(event.lpFee).truncate(18)
      let stakerFeeUsd = newPriceUsd.times(event.protocolFee)

      if (token.id.toLowerCase() != USDTAddress.toLowerCase()) {
        token.usdVolume = token.usdVolume.plus(usdVolume).truncate(18)
        BTCToken.usdVolume = BTCToken.usdVolume.plus(usdVolume).truncate(18)

        /** Update USD Candlesticks for token */
        handleCandlesticks({
          tradingPair: token.id.toLowerCase() + '_' + USDTAddress.toLowerCase(),
          blockTimestamp: event.timestamp,
          oldPrice: oldPriceUsd,
          newPrice: newPriceUsd,
          volume: usdVolume,
        })
      } else {
        token.lastPriceUsd = decimal.ONE
        token.usdVolume = token.usdVolume.plus(tokenAmount).truncate(18)
        BTCToken.usdVolume = BTCToken.usdVolume.plus(tokenAmount).truncate(18)
      }

      protocolStatsEntity.totalAmmVolumeUsd = protocolStatsEntity.totalAmmVolumeUsd.plus(usdVolume)
      protocolStatsEntity.totalAmmLpFeesUsd = protocolStatsEntity.totalAmmLpFeesUsd.plus(lpFeeUsd)
      protocolStatsEntity.totalAmmStakerFeesUsd = protocolStatsEntity.totalAmmStakerFeesUsd.plus(stakerFeeUsd)
      protocolStatsEntity.save()

      token.save()
      BTCToken.save()

      if (event.user.toHexString() == event.trader.toHexString()) {
        let userTotalsEntity = createAndReturnUserTotals(event.user)
        userTotalsEntity.totalAmmVolumeUsd = userTotalsEntity.totalAmmVolumeUsd.plus(usdVolume)
        userTotalsEntity.totalAmmStakerFeesUsd = userTotalsEntity.totalAmmStakerFeesUsd.plus(stakerFeeUsd)
        userTotalsEntity.totalAmmLpFeesUsd = userTotalsEntity.totalAmmLpFeesUsd.plus(lpFeeUsd)
        userTotalsEntity.save()
      }
    }
  }
}
