import { BigInt, Bytes, Address } from '@graphprotocol/graph-ts'
import { SmartToken, LiquidityPool, OwnerUpdate } from '../generated/schema'
import { OwnerUpdate as OwnerUpdateEvent } from '../generated/templates/SmartToken/SmartToken'
import { createAndReturnLiquidityPool } from './utils/LiquidityPool'

export function handleOwnerUpdate(event: OwnerUpdateEvent): void {
  let smartTokenEntity = SmartToken.load(event.address.toHexString())
  let oldConverterEntity = LiquidityPool.load(event.params._prevOwner.toHexString())
  let newConverterEntity = LiquidityPool.load(event.params._newOwner.toHexString())

  /** Trying to create a liquidity pool here always throws an error on the converterType method. I don't know why. */

  if (smartTokenEntity != null) {
    smartTokenEntity.owner = event.params._newOwner.toHexString()
    smartTokenEntity.save()
  }

  if (oldConverterEntity !== null && newConverterEntity !== null) {
    /** TODO: copy balance and other stats from old converter to new converter */
    const registry = oldConverterEntity.currentConverterRegistry
    newConverterEntity.currentConverterRegistry = registry
    newConverterEntity.smartToken = event.address.toHexString()
    oldConverterEntity.currentConverterRegistry = null
    oldConverterEntity.smartToken = null

    newConverterEntity.save()
    oldConverterEntity.save()
  }

  let ownerUpdate = new OwnerUpdate(event.transaction.hash.toHexString())
  ownerUpdate.emittedBy = event.address.toHexString()
  ownerUpdate.timestamp = event.block.timestamp
  ownerUpdate.prevOwner = event.params._prevOwner.toHexString()
  ownerUpdate.newOwner = event.params._newOwner.toHexString()
  ownerUpdate.save()
}
