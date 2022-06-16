import {
  BitcoinTransferBatchSending as BitcoinTransferBatchSendingEvent,
  BitcoinTransferFeeChanged as BitcoinTransferFeeChangedEvent,
  BitcoinTransferStatusUpdated as BitcoinTransferStatusUpdatedEvent,
  Frozen as FrozenEvent,
  NewBitcoinTransfer as NewBitcoinTransferEvent,
  Paused as PausedEvent,
  Unfrozen as UnfrozenEvent,
  Unpaused as UnpausedEvent,
} from '../generated/FastBTCBridge/FastBTCBridge'
import {
  BitcoinTransferBatchSending,
  BitcoinTransferFeeChanged,
  BitcoinTransferStatusUpdated,
  Frozen,
  NewBitcoinTransfer,
  Paused,
  Unfrozen,
  Unpaused,
} from '../generated/schema'
export function handleBitcoinTransferBatchSending(event: BitcoinTransferBatchSendingEvent): void {
  let entity = new BitcoinTransferBatchSending(event.transaction.hash.toHex())
  entity.bitcoinTxHash = event.params.bitcoinTxHash
  entity.transferBatchSize = event.params.transferBatchSize
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleBitcoinTransferFeeChanged(event: BitcoinTransferFeeChangedEvent): void {
  let entity = new BitcoinTransferFeeChanged(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.baseFeeSatoshi = event.params.baseFeeSatoshi
  entity.dynamicFee = event.params.dynamicFee
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleBitcoinTransferStatusUpdated(event: BitcoinTransferStatusUpdatedEvent): void {
  let entity = new BitcoinTransferStatusUpdated(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.transferId = event.params.transferId
  entity.newStatus = event.params.newStatus
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleFrozen(event: FrozenEvent): void {
  let entity = new Frozen(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.account = event.params.account
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleNewBitcoinTransfer(event: NewBitcoinTransferEvent): void {
  let entity = new NewBitcoinTransfer(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.transferId = event.params.transferId
  entity.btcAddress = event.params.btcAddress
  entity.nonce = event.params.nonce
  entity.amountSatoshi = event.params.amountSatoshi
  entity.feeSatoshi = event.params.feeSatoshi
  entity.rskAddress = event.params.rskAddress
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

}

export function handlePaused(event: PausedEvent): void {
  let entity = new Paused(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.account = event.params.account
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleUnfrozen(event: UnfrozenEvent): void {
  let entity = new Unfrozen(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.account = event.params.account
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleUnpaused(event: UnpausedEvent): void {
  let entity = new Unpaused(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.account = event.params.account
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}
