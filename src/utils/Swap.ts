import { Address, BigInt, BigDecimal } from '@graphprotocol/graph-ts'
import { Swap, Token, Transaction } from '../../generated/schema'
import { createAndReturnUser } from './User'
import { WRBTCAddress } from '../contracts/contracts'
import { updateLastPriceUsdAll } from './Prices'
import { decimal } from '@protofire/subgraph-toolkit'
import { createAndReturnProtocolStats } from './ProtocolStats'

export class ConversionEventForSwap {
  transaction: Transaction
  fromToken: Address
  toToken: Address
  fromAmount: BigDecimal
  toAmount: BigDecimal
  lpFee: BigDecimal
  protocolFee: BigDecimal
}

export const swapFunctionSigs = new Set<string>()
swapFunctionSigs.add('0xb37a4831') //convertByPath
swapFunctionSigs.add('0xb77d239b') //convertByPath
swapFunctionSigs.add('0xe321b540') //swapExternal

export function createAndReturnSwap(event: ConversionEventForSwap): Swap {
  createAndReturnUser(Address.fromString(event.transaction.from), BigInt.fromI32(event.transaction.timestamp))
  let swapEntity = Swap.load(event.transaction.id)
  if (swapEntity == null) {
    swapEntity = new Swap(event.transaction.id)
    swapEntity.numConversions = 1
    swapEntity.fromToken = event.fromToken.toHexString()
    swapEntity.toToken = event.toToken.toHexString()
    swapEntity.fromAmount = event.fromAmount
    swapEntity.toAmount = event.toAmount
    swapEntity.rate = event.fromAmount.div(event.toAmount)
    swapEntity.user = event.transaction.from
    swapEntity.timestamp = event.transaction.timestamp
    swapEntity.transaction = event.transaction.id
  } else {
    swapEntity.numConversions += 1
    swapEntity.toToken = event.toToken.toHexString()
    swapEntity.toAmount = event.toAmount
    swapEntity.rate = swapEntity.fromAmount.div(event.toAmount)
  }
  swapEntity.save()
  return swapEntity
}

export function updatePricing(event: ConversionEventForSwap): void {
  /** This threshold is set so that the last traded price is not skewed by rounding errors */
  const threshold = decimal.fromNumber(0.00000001)
  if (event.fromAmount < threshold || event.toAmount < threshold) {
    return
  }
  const protocolStatsEntity = createAndReturnProtocolStats()
  const USDTAddress = protocolStatsEntity.usdStablecoin.toLowerCase()
  let btcUsdPrice = protocolStatsEntity.btcUsdPrice

  const BTCToken = Token.load(WRBTCAddress.toLowerCase())

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
      return
    }

    /** IF SWAP IS BTC/USDT: Update lastPriceUsd on BTC */

    if (event.fromToken.toHexString().toLowerCase() == USDTAddress.toLowerCase() || event.toToken.toHexString().toLowerCase() == USDTAddress.toLowerCase()) {
      btcUsdPrice = tokenAmount.div(btcAmount)
      protocolStatsEntity.btcUsdPrice = btcUsdPrice
      protocolStatsEntity.save()
      BTCToken.prevPriceUsd = BTCToken.lastPriceUsd
      BTCToken.lastPriceUsd = btcUsdPrice
      BTCToken.prevPriceBtc = decimal.ONE
      BTCToken.lastPriceBtc = decimal.ONE

      updateLastPriceUsdAll()
    }

    if (token != null) {
      const newPriceBtc = btcAmount.div(tokenAmount)
      const newPriceUsd = newPriceBtc.times(btcUsdPrice)

      if (token.lastPriceUsd.gt(BigDecimal.zero())) {
        token.lastPriceUsd = newPriceUsd
      }

      token.prevPriceBtc = token.lastPriceBtc
      token.lastPriceBtc = newPriceBtc
      const lpFeeUsd = newPriceUsd.times(event.lpFee)
      const stakerFeeUsd = newPriceUsd.times(event.protocolFee)

      if (token.id.toLowerCase() != USDTAddress.toLowerCase()) {
        // TODO: handle this case
      } else {
        token.lastPriceUsd = decimal.ONE
      }

      protocolStatsEntity.totalAmmLpFeesUsd = protocolStatsEntity.totalAmmLpFeesUsd.plus(lpFeeUsd)
      protocolStatsEntity.totalAmmStakerFeesUsd = protocolStatsEntity.totalAmmStakerFeesUsd.plus(stakerFeeUsd)
      protocolStatsEntity.save()

      token.save()
      BTCToken.save()
    }
  }
}
