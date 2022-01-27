import {
  ConverterAnchorAdded as ConverterAnchorAddedEvent,
  ConverterAnchorRemoved as ConverterAnchorRemovedEvent,
  LiquidityPoolAdded as LiquidityPoolAddedEvent,
  LiquidityPoolRemoved as LiquidityPoolRemovedEvent,
  ConvertibleTokenAdded as ConvertibleTokenAddedEvent,
  ConvertibleTokenRemoved as ConvertibleTokenRemovedEvent,
  SmartTokenAdded as SmartTokenAddedEvent,
  SmartTokenRemoved as SmartTokenRemovedEvent,
  OwnerUpdate as OwnerUpdateEvent,
} from '../generated/ConverterRegistry/ConverterRegistry'
import {
  ConverterAnchorAdded,
  ConverterAnchorRemoved,
  LiquidityPoolAdded,
  LiquidityPoolRemoved,
  ConvertibleTokenAdded,
  ConvertibleTokenRemoved,
  SmartTokenAdded,
  SmartTokenRemoved,
  OwnerUpdate,
  LiquidityPool,
  ConverterRegistry,
} from '../generated/schema'
import { SmartToken as SmartTokenContract } from '../generated/ConverterRegistry/SmartToken'
import { log } from '@graphprotocol/graph-ts'
import { loadTransaction } from './utils/Transaction'
import { createAndReturnSmartToken } from './utils/SmartToken'
import { BigInt } from '@graphprotocol/graph-ts'

export function handleConverterAnchorAdded(event: ConverterAnchorAddedEvent): void {
  let entity = new ConverterAnchorAdded(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._anchor = event.params._anchor
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleConverterAnchorRemoved(event: ConverterAnchorRemovedEvent): void {
  let entity = new ConverterAnchorRemoved(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._anchor = event.params._anchor
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleLiquidityPoolAdded(event: LiquidityPoolAddedEvent): void {
  let entity = new LiquidityPoolAdded(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._liquidityPool = event.params._liquidityPool
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address

  let converterRegistryEntity = ConverterRegistry.load(event.address.toHex())
  if (converterRegistryEntity == null) {
    converterRegistryEntity = new ConverterRegistry(event.address.toHex())
    converterRegistryEntity.numConverters = BigInt.zero()
  }
  converterRegistryEntity.lastUsedAtBlockTimestamp = event.block.timestamp
  converterRegistryEntity.lastUsedAtTransactionHash = event.transaction.hash.toHex()
  converterRegistryEntity.lastUsedAtBlockNumber = event.block.number
  converterRegistryEntity.numConverters = converterRegistryEntity.numConverters.plus(BigInt.fromI32(1))

  converterRegistryEntity.save()
  entity.save()

  let liquidityPoolEntity = LiquidityPool.load(event.params._liquidityPool.toHex())
  if (liquidityPoolEntity != null) {
    liquidityPoolEntity.currentConverterRegistry = event.address.toHex()
    liquidityPoolEntity.save()
  }
}

export function handleLiquidityPoolRemoved(event: LiquidityPoolRemovedEvent): void {
  let entity = new LiquidityPoolRemoved(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._liquidityPool = event.params._liquidityPool
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleConvertibleTokenAdded(event: ConvertibleTokenAddedEvent): void {
  let entity = new ConvertibleTokenAdded(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._convertibleToken = event.params._convertibleToken
  entity._smartToken = event.params._smartToken
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleConvertibleTokenRemoved(event: ConvertibleTokenRemovedEvent): void {
  let entity = new ConvertibleTokenRemoved(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._convertibleToken = event.params._convertibleToken
  entity._smartToken = event.params._smartToken
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleSmartTokenAdded(event: SmartTokenAddedEvent): void {
  let smartTokenAddress = event.params._smartToken
  let smartTokenObj = createAndReturnSmartToken(smartTokenAddress)

  const isNew = smartTokenObj.isNew
  let smartTokenEntity = smartTokenObj.smartToken
  if (isNew) {
    log.debug('Smart Token created: {}', [smartTokenAddress.toHex()])
  }

  SmartTokenContract.bind(smartTokenAddress)

  if (smartTokenEntity.addedToRegistryBlockNumber === null) {
    smartTokenEntity.addedToRegistryBlockNumber = event.block.number
    smartTokenEntity.addedToRegistryTransactionHash = event.transaction.hash
  }

  log.debug('Smart Token added to registry: {}', [smartTokenAddress.toHex()])

  smartTokenEntity.currentConverterRegistry = event.address.toHex()

  smartTokenEntity.save()

  let entity = new SmartTokenAdded(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._smartToken = event.params._smartToken
  entity.save()
}

export function handleSmartTokenRemoved(event: SmartTokenRemovedEvent): void {
  let entity = new SmartTokenRemoved(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._smartToken = event.params._smartToken
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
  entity.save()
}
