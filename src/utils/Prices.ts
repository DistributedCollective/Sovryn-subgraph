/**
 * 1. Update ALL lastPriceUsd value when the btc price changes for ALL tokens
 * 2. Update candlesticks for usd for ALL tokens
 * 3. Update candlesticks for btc for ONE token
 */

import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { Token } from '../../generated/schema'
import { createAndReturnProtocolStats } from './ProtocolStats'
import { USDTAddress, WRBTCAddress } from '../contracts/contracts'
import { handleCandlesticks, ICandleSticks } from './Candlesticks'
import { decimal } from '@protofire/subgraph-toolkit'

export function updateLastPriceUsdAll(newBtcPrice: BigDecimal, timestamp: BigInt, usdVolume: BigDecimal): void {
  let protocolStats = createAndReturnProtocolStats()
  for (var i = 0; i < protocolStats.tokens.length; i++) {
    const token = protocolStats.tokens[i]

    let tokenEntity = Token.load(token)
    if (tokenEntity !== null) {
      if (tokenEntity.id.toLowerCase() == USDTAddress.toLowerCase()) {
        tokenEntity.lastPriceUsd = BigDecimal.fromString('1').truncate(2)
        tokenEntity.save()
      } else {
        const oldUsdPrice = tokenEntity.lastPriceUsd
        tokenEntity.lastPriceUsd = tokenEntity.lastPriceBtc.times(newBtcPrice).truncate(2)
        const newUsdPrice = tokenEntity.lastPriceUsd
        tokenEntity.save()

        const tradingPair = token + '_' + USDTAddress.toLowerCase()

        handleCandlesticks({
          blockTimestamp: timestamp,
          newPrice: newUsdPrice,
          oldPrice: oldUsdPrice,
          tradingPair: tradingPair,
          volume: BigDecimal.zero(),
        })
      }
    }
  }
}

export function updateTokenUsdCandlesticks(token: Address, newUsdPrice: BigDecimal): void {}

export function updateTokenBtcCandlesticks(token: Address, newBtcPrice: BigDecimal): void {}

export function convertToUsd(currency: Address, amount: BigInt): BigDecimal {
  let token = Token.load(currency.toHexString())
  if (token != null) {
    let usdPrice = token.lastPriceUsd
    return decimal.fromBigInt(amount, token.decimals).times(usdPrice).truncate(2)
  } else {
    log.debug('TOKEN WAS NULL: {}', [currency.toHexString()])
    return BigDecimal.zero()
  }
}

class PriceConversion {
  tokenToUsd: BigDecimal
  tokenToBtc: BigDecimal
}

export function getTokenPriceConversions(token: Address): PriceConversion {
  let tokenEntity = Token.load(token.toHexString())
  if (tokenEntity != null) {
    return {
      tokenToBtc: tokenEntity.lastPriceBtc,
      tokenToUsd: tokenEntity.lastPriceUsd,
    }
  } else {
    return {
      tokenToBtc: BigDecimal.zero(),
      tokenToUsd: BigDecimal.zero(),
    }
  }
}
