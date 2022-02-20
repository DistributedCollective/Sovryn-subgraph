import { BigInt, dataSource } from '@graphprotocol/graph-ts'
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
} from '../generated/templates/LiquidityPoolV1Converter/LiquidityPoolV1Converter'
import {
  Conversion as ConversionEventV2,
  LiquidityPoolV2Converter as LiquidityPoolV2Contract,
} from '../generated/templates/LiquidityPoolV2Converter/LiquidityPoolV2Converter'
import {
  Conversion as ConversionEventV1WithProtocol,
  LiquidityPoolV1ConverterProtocolFee as LiquidityPoolV1ConverterProtocolFeeContract,
} from '../generated/templates/LiquidityPoolV1ConverterProtocolFee/LiquidityPoolV1ConverterProtocolFee'
import {
  PriceDataUpdate,
  UserLiquidityHistory,
  Activation,
  Conversion,
  TokenRateUpdate,
  ConversionFeeUpdate,
  WithdrawFees,
  LiquidityPool,
  Token,
} from '../generated/schema'
import { ConversionEventForSwap, createAndReturnSwap } from './utils/Swap'
import { createAndReturnToken } from './utils/Token'

import { loadTransaction } from './utils/Transaction'
import { createAndReturnSmartToken } from './utils/SmartToken'
import { createAndReturnPoolToken } from './utils/PoolToken'
import { createAndReturnUser } from './utils/User'
import { createAndReturnLiquidityPool } from './utils/LiquidityPool'

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
  let entity = new UserLiquidityHistory(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  let user = createAndReturnUser(event.transaction.from)
  let reserveToken = Token.load(event.params._reserveToken.toHexString())
  let liquidityPool = LiquidityPool.load(event.address.toHexString())
  let transaction = loadTransaction(event)
  entity.type = 'Added'
  if (user != null) {
    entity.user = user.id
  }
  entity.provider = event.params._provider
  if (reserveToken != null) {
    entity.reserveToken = reserveToken.id
  }
  entity.amount = event.params._amount
  entity.newBalance = event.params._newBalance
  entity.newSupply = event.params._newSupply
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  if (liquidityPool != null) {
    entity.liquidityPool = liquidityPool.id
  }
  entity.save()
}

export function handleLiquidityRemoved(event: LiquidityRemovedEvent): void {
  let entity = new UserLiquidityHistory(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  let user = createAndReturnUser(event.transaction.from)
  let reserveToken = Token.load(event.params._reserveToken.toHexString())
  let liquidityPool = LiquidityPool.load(event.address.toHexString())
  let transaction = loadTransaction(event)
  entity.type = 'Removed'
  if (user != null) {
    entity.user = user.id
  }
  entity.provider = event.params._provider
  if (reserveToken != null) {
    entity.reserveToken = reserveToken.id
  }
  entity.amount = event.params._amount
  entity.newBalance = event.params._newBalance
  entity.newSupply = event.params._newSupply
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  if (liquidityPool != null) {
    entity.liquidityPool = liquidityPool.id
  }
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

  // let liquidityPool = LiquidityPool.load(dataSource.address().toHex())
  let liquidityPoolObj = createAndReturnLiquidityPool(dataSource.address(), event)
  const isNew = liquidityPoolObj.isNew
  const liquidityPool = liquidityPoolObj.liquidityPool

  if (!isNew) {
    let smartToken = createAndReturnSmartToken(event.params._anchor)
    liquidityPool.smartToken = smartToken.smartToken.id

    if (event.params._type == 1) {
      if (event.block.number < BigInt.fromI32(2393856)) {
        const contract = LiquidityPoolV1Contract.bind(event.address)
        let reserveTokenCountResult = contract.try_reserveTokenCount()
        if (!reserveTokenCountResult.reverted) {
          for (let i = 0; i < reserveTokenCountResult.value; i++) {
            let reserveTokenResult = contract.try_reserveTokens(BigInt.fromI32(i))
            if (!reserveTokenResult.reverted) {
              createAndReturnToken(reserveTokenResult.value, event.address, event.params._anchor)
              createAndReturnPoolToken(event.params._anchor, event.address, reserveTokenResult.value)
            }
          }
        }
      } else {
        const contract = LiquidityPoolV1ConverterProtocolFeeContract.bind(event.address)
        let reserveTokenCountResult = contract.try_reserveTokenCount()
        if (!reserveTokenCountResult.reverted) {
          for (let i = 0; i < reserveTokenCountResult.value; i++) {
            let reserveTokenResult = contract.try_reserveTokens(BigInt.fromI32(i))
            if (!reserveTokenResult.reverted) {
              createAndReturnToken(reserveTokenResult.value, event.address, event.params._anchor)
              createAndReturnPoolToken(event.params._anchor, event.address, reserveTokenResult.value)
            }
          }
        }
      }
    } else if (event.params._type == 2) {
      const contract = LiquidityPoolV2Contract.bind(event.address)
      let reserveTokenCountResult = contract.try_reserveTokenCount()
      if (!reserveTokenCountResult.reverted) {
        for (let i = 0; i < reserveTokenCountResult.value; i++) {
          let reserveTokenResult = contract.try_reserveTokens(BigInt.fromI32(i))
          if (!reserveTokenResult.reverted) {
            createAndReturnToken(reserveTokenResult.value, event.address, event.params._anchor)
            let poolTokenResult = contract.try_poolToken(reserveTokenResult.value)
            if (!poolTokenResult.reverted) {
              createAndReturnPoolToken(poolTokenResult.value, event.address, reserveTokenResult.value)
            }
          }
        }
      }
    }
  }

  liquidityPool.activated = event.params._activated
  liquidityPool.save()
}

export function handleConversionV1(event: ConversionEventV1): void {
  let entity = new Conversion(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._fromToken = event.params._fromToken.toHexString()
  entity._toToken = event.params._toToken.toHexString()
  entity._trader = event.params._trader
  entity._amount = event.params._amount
  entity._return = event.params._return
  entity._conversionFee = event.params._conversionFee
  entity._protocolFee = BigInt.zero()
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.swapTransaction = event.transaction.hash.toHex()
  entity.save()

  let parsedEvent: ConversionEventForSwap = {
    transactionHash: event.transaction.hash,
    fromToken: event.params._fromToken,
    toToken: event.params._toToken,
    fromAmount: event.params._amount,
    toAmount: event.params._return,
    timestamp: event.block.timestamp,
    user: event.transaction.from,
    trader: event.params._trader,
  }
  createAndReturnSwap(parsedEvent)
}

export function handleConversionV2(event: ConversionEventV2): void {
  let entity = new Conversion(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._fromToken = event.params._fromToken.toHexString()
  entity._toToken = event.params._toToken.toHexString()
  entity._trader = event.params._trader
  entity._amount = event.params._amount
  entity._return = event.params._return
  entity._conversionFee = event.params._conversionFee
  entity._protocolFee = BigInt.zero()
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.swapTransaction = event.transaction.hash.toHex()
  entity.save()

  let parsedEvent: ConversionEventForSwap = {
    transactionHash: event.transaction.hash,
    fromToken: event.params._fromToken,
    toToken: event.params._toToken,
    fromAmount: event.params._amount,
    toAmount: event.params._return,
    timestamp: event.block.timestamp,
    user: event.transaction.from,
    trader: event.params._trader,
  }
  createAndReturnSwap(parsedEvent)
}

export function handleConversionV1_2(event: ConversionEventV1WithProtocol): void {
  let entity = new Conversion(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._fromToken = event.params._fromToken.toHexString()
  entity._toToken = event.params._toToken.toHexString()
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

  let parsedEvent: ConversionEventForSwap = {
    transactionHash: event.transaction.hash,
    fromToken: event.params._fromToken,
    toToken: event.params._toToken,
    fromAmount: event.params._amount,
    toAmount: event.params._return,
    timestamp: event.block.timestamp,
    user: event.transaction.from,
    trader: event.params._trader,
  }
  createAndReturnSwap(parsedEvent)
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

export function handleOwnerUpdate(event: OwnerUpdateEvent): void {}
