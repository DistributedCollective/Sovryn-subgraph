import { Address, BigDecimal, log } from '@graphprotocol/graph-ts'

import { Token } from '../../generated/schema'
import { ConversionEventForSwap } from './Swap'
import { createAndReturnUserTotals, createAndReturnProtocolStats } from './ProtocolStats'

export function updateVolumes(parsedEvent: ConversionEventForSwap): void {
  updateTokensVolume(parsedEvent)
  updateUserTotalVolume(parsedEvent)
  updateProtocolStatsVolume(parsedEvent)
}
function updateTokensVolume(parsedEvent: ConversionEventForSwap): void {
  const fromToken = Token.load(parsedEvent.fromToken.toHex())

  if (fromToken != null) {
    updateTokenVolume(fromToken, parsedEvent.fromAmount)
    fromToken.save()
  }

  const toToken = Token.load(parsedEvent.toToken.toHex())

  if (toToken != null) {
    updateTokenVolume(toToken, parsedEvent.toAmount)
    toToken.save()
  }
}

function updateTokenVolume(token: Token, amount: BigDecimal): Token {
  token.tokenVolume = token.tokenVolume.plus(amount)
  token.btcVolume = token.btcVolume.plus(amount.times(token.lastPriceBtc))
  token.usdVolume = token.usdVolume.plus(amount.times(token.lastPriceUsd))

  return token
}

function updateUserTotalVolume(parsedEvent: ConversionEventForSwap): void {
  // TODO: should we load trader or user or both?
  const userTotalsEntity = createAndReturnUserTotals(parsedEvent.user)
  log.debug('src/utils/Volumes.ts ~ Volumes.ts ~ 39 ~  parsedEvent.user.toHex(){}', [parsedEvent.user.toHex()])

  const fromVolumeUsd = tokenVolumeUsd(parsedEvent.fromToken, parsedEvent.fromAmount)
  userTotalsEntity.totalAmmVolumeUsd = userTotalsEntity.totalAmmVolumeUsd.plus(fromVolumeUsd)

  const toVolumeUsd = tokenVolumeUsd(parsedEvent.toToken, parsedEvent.toAmount)
  userTotalsEntity.totalAmmVolumeUsd = userTotalsEntity.totalAmmVolumeUsd.plus(toVolumeUsd)

  userTotalsEntity.save()
}

function tokenVolumeUsd(token: Address, amount: BigDecimal): BigDecimal {
  const tokenEntity = Token.load(token.toHex())
  let volumeUsd = BigDecimal.zero()
  if (tokenEntity != null) {
    volumeUsd = amount.times(tokenEntity.lastPriceUsd)
  }
  return volumeUsd
}

function updateProtocolStatsVolume(parsedEvent: ConversionEventForSwap): void {
  const protocolStats = createAndReturnProtocolStats()
  const fromVolumeUsd = tokenVolumeUsd(parsedEvent.fromToken, parsedEvent.fromAmount)
  const toVolumeUsd = tokenVolumeUsd(parsedEvent.toToken, parsedEvent.toAmount)
  protocolStats.totalAmmVolumeUsd = protocolStats.totalAmmVolumeUsd.plus(fromVolumeUsd).plus(toVolumeUsd)
  protocolStats.save()
}
