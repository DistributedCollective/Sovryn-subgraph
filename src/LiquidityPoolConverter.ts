import {
  PriceDataUpdate as PriceDataUpdateEvent,
  LiquidityAdded as LiquidityAddedEvent,
  LiquidityRemoved as LiquidityRemovedEvent,
  Activation as ActivationEvent,
  Conversion as ConversionEventV1,
  TokenRateUpdate as TokenRateUpdateEvent,
  ConversionFeeUpdate as ConversionFeeUpdateEvent,
  WithdrawFees as WithdrawFeesEvent,
  OwnerUpdate as OwnerUpdateEvent,
  LiquidityPoolV1Converter as LiquidityPoolV1Contract,
} from '../generated/LiquidityPoolV1Converter/LiquidityPoolV1Converter'
import {
  Conversion as ConversionEventV2,
  LiquidityPoolV2Converter as LiquidityPoolV2Contract,
} from '../generated/LiquidityPoolV2Converter/LiquidityPoolV2Converter'
import {
  PriceDataUpdate,
  LiquidityAdded,
  LiquidityRemoved,
  Activation,
  Conversion,
  TokenRateUpdate,
  ConversionFeeUpdate,
  WithdrawFees,
  OwnerUpdate,
  LiquidityPool,
  Token,
} from '../generated/schema'
import { createSwapV1, createSwapV2 } from './utils/Swap'
import { createAndReturnToken } from './utils/Token'

import { loadTransaction } from './utils/Transaction'
import { BigInt } from '@graphprotocol/graph-ts'

export function handlePriceDataUpdate(event: PriceDataUpdateEvent): void {
  let entity = new PriceDataUpdate(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._connectorToken = event.params._connectorToken
  entity._tokenSupply = event.params._tokenSupply
  entity._connectorBalance = event.params._connectorBalance
  entity._connectorWeight = event.params._connectorWeight
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleLiquidityAdded(event: LiquidityAddedEvent): void {
  let entity = new LiquidityAdded(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._provider = event.params._provider
  entity._reserveToken = event.params._reserveToken
  entity._amount = event.params._amount
  entity._newBalance = event.params._newBalance
  entity._newSupply = event.params._newSupply
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleLiquidityRemoved(event: LiquidityRemovedEvent): void {
  let entity = new LiquidityRemoved(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._provider = event.params._provider
  entity._reserveToken = event.params._reserveToken
  entity._amount = event.params._amount
  entity._newBalance = event.params._newBalance
  entity._newSupply = event.params._newSupply
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleActivation(event: ActivationEvent): void {
  let entity = new Activation(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._type = event.params._type
  entity._anchor = event.params._anchor
  entity._activated = event.params._activated
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  let liquidityPool = LiquidityPool.load(event.address.toHex())

  if (liquidityPool != null) {
    liquidityPool.activated = event.params._activated
    liquidityPool.anchor = event.params._anchor
    liquidityPool.underlyingAssets = []
    liquidityPool.poolTokens = []
    let underlyingAssets: string[] = []
    let poolTokens: string[] = []

    if (event.params._type == 1) {
      poolTokens[0] = event.params._anchor.toHex()
      const contract = LiquidityPoolV1Contract.bind(event.address)
      let reserveTokenCountResult = contract.try_reserveTokenCount()
      if (!reserveTokenCountResult.reverted && liquidityPool.underlyingAssets != null) {
        for (let i = 0; i < reserveTokenCountResult.value; i++) {
          let reserveTokenResult = contract.try_reserveTokens(BigInt.fromU32(i))
          if (!reserveTokenResult.reverted) {
            let token = createAndReturnToken(reserveTokenResult.value)
            underlyingAssets[i] = token.id
          }
        }
      }
    } else if (event.params._type == 2) {
      const contract = LiquidityPoolV2Contract.bind(event.address)
      let reserveTokenCountResult = contract.try_reserveTokenCount()
      if (!reserveTokenCountResult.reverted) {
        for (let i = 0; i < reserveTokenCountResult.value; i++) {
          let reserveTokenResult = contract.try_reserveTokens(BigInt.fromU32(i))
          if (!reserveTokenResult.reverted) {
            let token = createAndReturnToken(reserveTokenResult.value)
            underlyingAssets[i] = token.id
            let poolTokenResult = contract.try_poolToken(reserveTokenResult.value)
            if (!poolTokenResult.reverted) {
              poolTokens[i] = poolTokenResult.value.toHex()
            }
          }
        }
      }
    }

    liquidityPool.poolTokens = poolTokens
    liquidityPool.underlyingAssets = underlyingAssets
    liquidityPool.save()
  }
}

export function handleConversionV1(event: ConversionEventV1): void {
  let entity = new Conversion(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._fromToken = event.params._fromToken
  entity._toToken = event.params._toToken
  entity._trader = event.params._trader
  entity._amount = event.params._amount
  entity._return = event.params._return
  entity._conversionFee = event.params._conversionFee
  entity._protocolFee = event.params._protocolFee
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address

  entity.save()

  createSwapV1(event)
}

export function handleConversionV2(event: ConversionEventV2): void {
  let entity = new Conversion(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._fromToken = event.params._fromToken
  entity._toToken = event.params._toToken
  entity._trader = event.params._trader
  entity._amount = event.params._amount
  entity._return = event.params._return
  entity._conversionFee = event.params._conversionFee
  entity._protocolFee = BigInt.fromString('0')
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  createSwapV2(event)
}

export function handleTokenRateUpdate(event: TokenRateUpdateEvent): void {
  let entity = new TokenRateUpdate(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._token1 = event.params._token1
  entity._token2 = event.params._token2
  entity._rateN = event.params._rateN
  entity._rateD = event.params._rateD
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleConversionFeeUpdate(event: ConversionFeeUpdateEvent): void {
  let entity = new ConversionFeeUpdate(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._prevFee = event.params._prevFee
  entity._newFee = event.params._newFee
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleWithdrawFees(event: WithdrawFeesEvent): void {
  let entity = new WithdrawFees(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.sender = event.params.sender
  entity.receiver = event.params.receiver
  entity.token = event.params.token
  entity.protocolFeeAmount = event.params.protocolFeeAmount
  entity.wRBTCConverted = event.params.wRBTCConverted
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleOwnerUpdate(event: OwnerUpdateEvent): void {
  let entity = new OwnerUpdate(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._prevOwner = event.params._prevOwner
  entity._newOwner = event.params._newOwner
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}