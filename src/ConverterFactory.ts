import { NewConverter as NewConverterEvent, OwnerUpdate as OwnerUpdateEvent } from '../generated/ConverterFactory/ConverterFactory'

import { createAndReturnTransaction } from './utils/Transaction'
import { createAndReturnLiquidityPool } from './utils/LiquidityPool'

export function handleNewConverter(event: NewConverterEvent): void {
  createAndReturnTransaction(event)
  /**
   * Create new LiquidityPool
   */
  createAndReturnLiquidityPool(event.params._converter, event.block.timestamp, event.block.number, event.transaction.hash.toHexString())
}

export function handleOwnerUpdate(event: OwnerUpdateEvent): void {}
