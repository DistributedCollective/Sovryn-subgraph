import { BigInt } from '@graphprotocol/graph-ts'

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
import { LiquidityPoolAdded, LiquidityPoolRemoved, SmartTokenAdded, SmartTokenRemoved, LiquidityPool, ConverterRegistry, SmartToken } from '../generated/schema'
import { SmartToken as SmartTokenContract } from '../generated/ConverterRegistry/SmartToken'
import { log } from '@graphprotocol/graph-ts'
import { createAndReturnTransaction } from './utils/Transaction'
import { createAndReturnToken } from './utils/Token'
import { createAndReturnSmartToken } from './utils/SmartToken'
import { createAndReturnLiquidityPool } from './utils/LiquidityPool'
import { createAndReturnConverterRegistry } from './utils/ConverterRegistry'

export function handleConverterAnchorAdded(event: ConverterAnchorAddedEvent): void {
  /** This adds a SmartToken to a V2 pool */
}

export function handleConverterAnchorRemoved(event: ConverterAnchorRemovedEvent): void {}

export function handleLiquidityPoolAdded(event: LiquidityPoolAddedEvent): void {
  /** This adds pool token, not a pool!!!! The _liquidityPool property is a new pool token!! */
}

export function handleLiquidityPoolRemoved(event: LiquidityPoolRemovedEvent): void {
  /** This removes a pool token - this is not necessary to handle */
}

export function handleConvertibleTokenAdded(event: ConvertibleTokenAddedEvent): void {
  /** This adds a token / smartToken pair */
  /** Tokens get added from Factory/LiquidityPool, they don't need to be added here as well. It makes the build bigger  */
  // const smartTokenAddress = event.params._smartToken
  // const smartTokenContract = SmartTokenContract.bind(smartTokenAddress)
  // const converterAddress = smartTokenContract.owner()
  // const token = createAndReturnToken(event.params._convertibleToken, converterAddress, smartTokenAddress)
  // token.currentConverterRegistry = event.address.toHex()
  // token.save()
}

export function handleConvertibleTokenRemoved(event: ConvertibleTokenRemovedEvent): void {
  /** This removes a token / smartToken pair */
}

export function handleSmartTokenAdded(event: SmartTokenAddedEvent): void {
  createAndReturnConverterRegistry(event.address)
  let smartTokenAddress = event.params._smartToken
  let smartTokenObj = createAndReturnSmartToken(smartTokenAddress)
  const isNew = smartTokenObj.isNew
  let smartTokenEntity = smartTokenObj.smartToken
  if (isNew) {
    log.debug('Smart Token created: {}', [smartTokenAddress.toHex()])
  }
  if (smartTokenEntity.addedToRegistryBlockNumber === null) {
    smartTokenEntity.addedToRegistryBlockNumber = event.block.number
    smartTokenEntity.addedToRegistryTransactionHash = event.transaction.hash
  }
  log.debug('Smart Token added to registry: {}', [smartTokenAddress.toHex()])
  smartTokenEntity.currentConverterRegistry = event.address.toHexString()
  smartTokenEntity.save()

  let liquidityPoolEntity = LiquidityPool.load(smartTokenEntity.owner)
  if (liquidityPoolEntity !== null) {
    liquidityPoolEntity.currentConverterRegistry = event.address.toHexString()
    liquidityPoolEntity.save()
  }

  let entity = new SmartTokenAdded(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._smartToken = event.params._smartToken
  entity.save()
}

export function handleSmartTokenRemoved(event: SmartTokenRemovedEvent): void {
  /** This event has never been emitted - no need to handle */
}

export function handleOwnerUpdate(event: OwnerUpdateEvent): void {}
