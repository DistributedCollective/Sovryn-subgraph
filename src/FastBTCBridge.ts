import {
  BitcoinTransferBatchSending as BitcoinTransferBatchSendingEvent,
  BitcoinTransferFeeChanged as BitcoinTransferFeeChangedEvent,
  BitcoinTransferStatusUpdated as BitcoinTransferStatusUpdatedEvent,
  NewBitcoinTransfer as NewBitcoinTransferEvent,
} from '../generated/FastBTCBridge/FastBTCBridge'
import { BitcoinTransferBatchSending } from '../generated/schema'
import { aggregateBidirectionalBridgeStat, createBidirectionalBridgeStat } from './utils/BidirectionalBridgeStats'
import { BitcoinTransferStatus, createBitcoinTransfer, loadBitcoinTransfer } from './utils/BitcoinTransfer'

import { createAndReturnTransaction } from './utils/Transaction'

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

export function handleBitcoinTransferFeeChanged(event: BitcoinTransferFeeChangedEvent): void {}

export function handleBitcoinTransferStatusUpdated(event: BitcoinTransferStatusUpdatedEvent): void {
  let transaction = createAndReturnTransaction(event)

  let bitcoinTransferBatchSending = BitcoinTransferBatchSending.load(event.transaction.hash.toHex())

  const bitcoinTransfer = loadBitcoinTransfer(event.params.transferId)
  bitcoinTransfer.status = BitcoinTransferStatus.getStatus(event.params.newStatus)
  bitcoinTransfer.bitcoinTxHash = bitcoinTransferBatchSending != null ? bitcoinTransferBatchSending.bitcoinTxHash : bitcoinTransfer.bitcoinTxHash

  bitcoinTransfer.updatedAtBlockNumber = event.block.number.toI32()
  bitcoinTransfer.updatedAtTimestamp = event.block.timestamp.toI32()
  bitcoinTransfer.updatedAtTx = event.transaction.hash.toHex()
  bitcoinTransfer.save()

  aggregateBidirectionalBridgeStat('0', event.params.newStatus, bitcoinTransfer, transaction)
  aggregateBidirectionalBridgeStat(bitcoinTransfer.user, event.params.newStatus, bitcoinTransfer, transaction)
}

export function handleNewBitcoinTransfer(event: NewBitcoinTransferEvent): void {
  let transaction = createAndReturnTransaction(event)

  const bitcoinTransfer = createBitcoinTransfer(event)

  const bidirectionalBridgeStat = createBidirectionalBridgeStat('0', transaction)
  bidirectionalBridgeStat.totalAmountBTCInitialized = bidirectionalBridgeStat.totalAmountBTCInitialized.plus(bitcoinTransfer.totalAmountBTC)
  bidirectionalBridgeStat.updatedAtTx = transaction.id
  bidirectionalBridgeStat.save()

  const bidirectionalBridgeTraderStat = createBidirectionalBridgeStat(event.params.rskAddress.toHex(), transaction)
  bidirectionalBridgeTraderStat.totalAmountBTCInitialized = bidirectionalBridgeTraderStat.totalAmountBTCInitialized.plus(bitcoinTransfer.totalAmountBTC)
  bidirectionalBridgeTraderStat.updatedAtTx = transaction.id
  bidirectionalBridgeTraderStat.save()
}
