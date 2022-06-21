import { BigDecimal } from '@graphprotocol/graph-ts'
import { BitcoinTransferStatus } from './BitcoinTransfer'
import { BidirectionalBridgeStat, BitcoinTransfer, Transaction } from '../../generated/schema'

export const createBidirectionalBridgeStat = (id: string, transaction: Transaction): BidirectionalBridgeStat => {
  let bidirectionalBridgeStat = BidirectionalBridgeStat.load(id)
  if (bidirectionalBridgeStat == null) {
    bidirectionalBridgeStat = new BidirectionalBridgeStat(id)
    bidirectionalBridgeStat.user = id
    bidirectionalBridgeStat.totalAmountBTCInitialized = BigDecimal.zero()
    bidirectionalBridgeStat.totalAmountBTCSending = BigDecimal.zero()
    bidirectionalBridgeStat.totalAmountBTCMined = BigDecimal.zero()
    bidirectionalBridgeStat.totalFeesBTC = BigDecimal.zero()
    bidirectionalBridgeStat.totalAmountBTCRefunded = BigDecimal.zero()
    bidirectionalBridgeStat.createdAtTx = transaction.id
  }
  bidirectionalBridgeStat.updatedAtTx = transaction.id
  bidirectionalBridgeStat.save()
  return bidirectionalBridgeStat
}

export function aggregateBidirectionalBridgeStat(id: string, status: i32, bitcoinTransfer: BitcoinTransfer, transaction: Transaction): void {
  const bidirectionalBridgeStat = createBidirectionalBridgeStat(id, transaction)
  if (BitcoinTransferStatus.getStatus(status) == BitcoinTransferStatus.SENDING) {
    bidirectionalBridgeStat.totalAmountBTCInitialized = bidirectionalBridgeStat.totalAmountBTCInitialized.minus(bitcoinTransfer.totalAmountBTC)
    bidirectionalBridgeStat.totalAmountBTCSending = bidirectionalBridgeStat.totalAmountBTCSending.plus(bitcoinTransfer.totalAmountBTC)
  }

  if (BitcoinTransferStatus.getStatus(status) == BitcoinTransferStatus.MINED) {
    bidirectionalBridgeStat.totalAmountBTCSending = bidirectionalBridgeStat.totalAmountBTCSending.minus(bitcoinTransfer.totalAmountBTC)
    bidirectionalBridgeStat.totalAmountBTCMined = bidirectionalBridgeStat.totalAmountBTCMined.plus(bitcoinTransfer.totalAmountBTC)
    bidirectionalBridgeStat.totalFeesBTC = bidirectionalBridgeStat.totalFeesBTC.plus(bitcoinTransfer.feeBTC)
  }

  if (BitcoinTransferStatus.getStatus(status) == BitcoinTransferStatus.REFUNDED) {
    bidirectionalBridgeStat.totalAmountBTCSending = bidirectionalBridgeStat.totalAmountBTCSending.minus(bitcoinTransfer.totalAmountBTC)
    bidirectionalBridgeStat.totalAmountBTCMined = bidirectionalBridgeStat.totalAmountBTCRefunded.plus(bitcoinTransfer.totalAmountBTC)
  }

  bidirectionalBridgeStat.updatedAtTx = transaction.id
  bidirectionalBridgeStat.save()
}
