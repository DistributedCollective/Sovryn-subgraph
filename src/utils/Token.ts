import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { Token, LiquidityPoolToken, TokenSmartToken, ProtocolStats, PoolToken } from '../../generated/schema'
import { ERC20 as ERC20TokenContract } from '../../generated/templates/LiquidityPoolV1Converter/ERC20'
import { createAndReturnProtocolStats } from './ProtocolStats'
import { decimal, DEFAULT_DECIMALS } from '@protofire/subgraph-toolkit'
import { stablecoins } from '../contracts/contracts'
import { createAndReturnPoolToken } from './PoolToken'

export function createAndReturnToken(tokenAddress: Address, converterAddress: Address, smartTokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHex())
  let isNewToken = false
  let protocolStats: ProtocolStats
  if (token === null) {
    isNewToken = true
    token = new Token(tokenAddress.toHex())
    token.prevPriceUsd = BigDecimal.zero()
    token.lastPriceUsd = BigDecimal.zero()
    token.prevPriceBtc = BigDecimal.zero()
    token.lastPriceBtc = BigDecimal.zero()
    token.btcVolume = BigDecimal.zero()
    token.usdVolume = BigDecimal.zero()
    token.tokenVolume = BigDecimal.zero()

    protocolStats = createAndReturnProtocolStats()
    if (stablecoins.includes(tokenAddress.toHexString().toLowerCase())) {
      protocolStats.usdStablecoin = tokenAddress.toHexString().toLowerCase()
      token.lastPriceUsd = decimal.ONE
    }
    protocolStats.tokens = protocolStats.tokens.concat([tokenAddress.toHexString()])

    log.debug('Token created: {}', [tokenAddress.toHex()])
    const tokenContract = ERC20TokenContract.bind(tokenAddress)
    let connectorTokenNameResult = tokenContract.try_name()
    if (!connectorTokenNameResult.reverted) {
      token.name = connectorTokenNameResult.value
    }
    let connectorTokenSymbolResult = tokenContract.try_symbol()
    if (!connectorTokenSymbolResult.reverted) {
      token.symbol = connectorTokenSymbolResult.value
    }
    let connectorTokenDecimalsResult = tokenContract.try_decimals()
    if (!connectorTokenDecimalsResult.reverted) {
      token.decimals = connectorTokenDecimalsResult.value
    }

    // initialize bridge aggregation per token properties
    token.totalAmountCrossedIn = BigDecimal.zero()
    token.totalAmountCrossedOut = BigDecimal.zero()
    token.totalAmountCrossedInBSC = BigDecimal.zero()
    token.totalAmountCrossedOutBSC = BigDecimal.zero()
    token.totalAmountCrossedInETH = BigDecimal.zero()
    token.totalAmountCrossedOutETH = BigDecimal.zero()
  }
  let liquidityPoolToken = LiquidityPoolToken.load(converterAddress.toHex() + tokenAddress.toHex())
  if (liquidityPoolToken == null) {
    liquidityPoolToken = new LiquidityPoolToken(converterAddress.toHex() + tokenAddress.toHex())
    /** Try to load PoolToken first */
    let poolTokenEntity = PoolToken.load(smartTokenAddress.toHexString())
    if (poolTokenEntity == null) {
      createAndReturnPoolToken(smartTokenAddress, converterAddress, tokenAddress)
    }
    liquidityPoolToken.poolToken = smartTokenAddress.toHex()
    liquidityPoolToken.totalVolume = BigDecimal.zero()
    liquidityPoolToken.volumeBought = BigDecimal.zero()
    liquidityPoolToken.volumeSold = BigDecimal.zero()
  }

  liquidityPoolToken.token = tokenAddress.toHex()
  liquidityPoolToken.liquidityPool = converterAddress.toHex()
  liquidityPoolToken.save()

  let tokenSmartToken = TokenSmartToken.load(tokenAddress.toHex() + smartTokenAddress.toHex())
  if (tokenSmartToken === null) {
    tokenSmartToken = new TokenSmartToken(tokenAddress.toHex() + smartTokenAddress.toHex())
    tokenSmartToken.token = tokenAddress.toHex()
    tokenSmartToken.smartToken = smartTokenAddress.toHex()
    tokenSmartToken.save()
  }
  token.save()
  if (protocolStats != null) {
    protocolStats.save()
  }
  return token
}

export function decimalize(amount: BigInt, tokenAddress: Address): BigDecimal {
  let tokenEntity = Token.load(tokenAddress.toHexString())
  if (tokenEntity !== null) {
    return decimal.fromBigInt(amount, tokenEntity.decimals)
  } else {
    return decimal.fromBigInt(amount, DEFAULT_DECIMALS)
  }
}

export function decimalizeFromToken(amount: BigInt, token: Token): BigDecimal {
  return decimal.fromBigInt(amount, token.decimals)
}
