/**
 * 1. Update ALL lastPriceUsd value when the btc price changes for ALL tokens
 * 2. Update candlesticks for usd for ALL tokens
 * 3. Update candlesticks for btc for ONE token
 */

import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { Swap, Token } from '../../generated/schema'
import { TokenRateUpdate as TokenRateUpdateEvent } from '../../generated/templates/LiquidityPoolV1Converter/LiquidityPoolV1Converter'
import { createAndReturnProtocolStats } from './ProtocolStats'
import { USDTAddress, WRBTCAddress } from '../contracts/contracts'
// import { handleCandlesticks, ICandleSticks } from './Candlesticks'
import { decimal } from '@protofire/subgraph-toolkit'

export function updateLastTradedPriceBTC(event: TokenRateUpdateEvent): void {
  const token1Address = event.params._token1
  const token2Address = event.params._token2

  log.debug('updateLastTradedPriceBTC - token1Address {}, token2Address {}', [
    token1Address.toHex(),
    token2Address.toHex(),
  ])

  let price = BigDecimal.zero()
  if (token1Address.toHex().toLowerCase() == WRBTCAddress.toLowerCase()) {
    const token = Token.load(token2Address.toHex())
    if (token != null) {
      if (event.params._rateN.gt(BigInt.zero())) {
        price = event.params._rateD.toBigDecimal().div(event.params._rateN.toBigDecimal())
      }
      log.debug('updateLastTradedPriceBTC1 - token {}, price {}', [token.symbol, price.toString()])
      token.lastPriceBtc = price
      token.save()
    }
  } else if (token2Address.toHex.toString() == WRBTCAddress.toLowerCase()) {
    if (event.params._rateD.gt(BigInt.zero())) {
      price = event.params._rateN.toBigDecimal().div(event.params._rateD.toBigDecimal())
    }

    const token = Token.load(token1Address.toHex())
    if (token != null) {
      log.debug('updateLastTradedPriceBTC2 - token {}, price {}', [token.symbol, price.toString()])
      token.lastPriceBtc = price
      token.save()
    }
  } else {
    log.debug('updateLastTradedPriceBTC3 - token1Address {}, token2Address {}', [
      token1Address.toHex(),
      token2Address.toHex(),
    ])
    // TODO: take care of case where BTC is not a part of the conversion
  }
}

export function updateLastPriceUsdAll(event: TokenRateUpdateEvent): void {
  const btcUsdPrice = calculateBtcUSdPrice(event)
  log.debug('updateLastPriceUsdAll2 - btcUsdPrice {}', [btcUsdPrice.toString()])
  let protocolStats = createAndReturnProtocolStats()
  for (var i = 0; i < protocolStats.tokens.length; i++) {
    const token = protocolStats.tokens[i]

    let tokenEntity = Token.load(token)
    if (tokenEntity != null) {
      if (tokenEntity.id.toLowerCase() == USDTAddress.toLowerCase()) {
        tokenEntity.lastPriceUsd = decimal.ONE
        tokenEntity.save()
      } else if (tokenEntity.id.toLowerCase() != WRBTCAddress.toLowerCase()) {
        log.debug('updateLastPriceUsdAll2 - tokenEntity.symbol {}', [tokenEntity.symbol])
        log.debug('updateLastPriceUsdAll2 - tokenEntity.lastPriceBtc {}', [tokenEntity.lastPriceBtc.toString()])
        const lastPriceUsd = tokenEntity.lastPriceBtc.times(btcUsdPrice)
        log.debug('updateLastPriceUsdAll2 - lastPriceUsd {}', [lastPriceUsd.toString()])
        tokenEntity.lastPriceUsd = lastPriceUsd
        tokenEntity.save()
      } else if (tokenEntity.id.toLowerCase() == WRBTCAddress.toLowerCase()) {
        log.debug('updateLastPriceUsdAll2 - WRBTC tokenEntity.symbol {}, price {}', [
          tokenEntity.symbol.toLowerCase(),
          btcUsdPrice.toString(),
        ])
        tokenEntity.lastPriceUsd = btcUsdPrice
        tokenEntity.save()
      }
    }
  }
}

function calculateBtcUSdPrice(event: TokenRateUpdateEvent): BigDecimal {
  let price = BigDecimal.zero()
  if (event.params._token1.toHex().toLowerCase() == USDTAddress.toLowerCase()) {
    if (event.params._rateD.gt(BigInt.zero())) {
      price = event.params._rateD.toBigDecimal().div(event.params._rateN.toBigDecimal())
    }
  } else if (event.params._token2.toHex().toLowerCase() == USDTAddress.toLowerCase()) {
    if (event.params._rateN.gt(BigInt.zero())) {
      price = event.params._rateN.toBigDecimal().div(event.params._rateD.toBigDecimal())
    }
  }
  return price
}

export function updateTokensVolume(swap: Swap): void {
  const fromToken = Token.load(swap.fromToken)

  if (fromToken != null) {
    updateVolume(fromToken, swap.fromAmount)
    fromToken.save()
  }

  const toToken = Token.load(swap.toToken)

  if (toToken != null) {
    updateVolume(toToken, swap.toAmount)
    toToken.save()
  }
}

function updateVolume(token: Token, amount: BigInt): Token {
  const decimalAmount = decimal.fromBigInt(amount, token.decimals)
  token.tokenVolume = token.tokenVolume.plus(decimalAmount)
  token.btcVolume = token.btcVolume.plus(decimalAmount.times(token.lastPriceBtc))
  token.usdVolume = token.usdVolume.plus(decimalAmount.times(token.lastPriceUsd))

  return token
}

export function updateTokenUsdCandlesticks(token: Address, newUsdPrice: BigDecimal): void {}

export function updateTokenBtcCandlesticks(token: Address, newBtcPrice: BigDecimal): void {}
