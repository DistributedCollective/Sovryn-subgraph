import { BigInt, Address, crypto, ByteArray } from '@graphprotocol/graph-ts'
import { decimal } from '@protofire/subgraph-toolkit'
import { CrossTransfer, Transaction, Token } from '../../generated/schema'
import { CrossStatus } from './types'

export class CrossTransferEvent {
  id: string = ''
  direction: string
  externalChain: string
  bridgeAddress: string
  status: string
  originalTokenAddress: string
  receiver: Address
  sender: string
  amount: BigInt
  symbol: string
  sourceChainTransactionHash: string
  decimals: i32
  granularity: BigInt
  transaction: Transaction
}

// we create a crossTransferId for outgoing transfers from the params of the cross events
// the id is created this way to simulate the as close as possible (but not exactly) the same id as in the smart contract
export const getCrossTransferId = (crossTransferEvent: CrossTransferEvent): ByteArray => {
  const id = crypto.keccak256(
    ByteArray.fromUTF8(
      crossTransferEvent.originalTokenAddress +
        '-' +
        crossTransferEvent.receiver.toHex() +
        '-' +
        crossTransferEvent.amount.toHex() +
        '-' +
        // symbol +
        // '-' +
        crossTransferEvent.decimals.toString() +
        '-' +
        crossTransferEvent.granularity.toHex(),
      // '-' +
      // crossTransferEvent.userData.toHex(),
    ),
  )
  return id
}

export const createAndReturnCrossTransfer = (crossTransferEvent: CrossTransferEvent): CrossTransfer => {
  // on votes and executed events (incoming transfers) from the federation we have the ID in the events,
  // on cross events (from the bridge) for outgoing transfers we don't have an id and therefor we have to generate it
  const id = crossTransferEvent.id != '' ? crossTransferEvent.id : getCrossTransferId(crossTransferEvent).toHex()
  let crossTransfer = CrossTransfer.load(id)
  if (crossTransfer == null) {
    const token = Token.load(crossTransferEvent.originalTokenAddress)
    crossTransfer = new CrossTransfer(id)
    crossTransfer.direction = crossTransferEvent.direction.toString()
    crossTransfer.votes = 0
    crossTransfer.status = crossTransferEvent.status.toString()
    crossTransfer.receiver = crossTransferEvent.receiver.toHexString()
    crossTransfer.originalTokenAddress = crossTransferEvent.originalTokenAddress
    if (token != null) {
      crossTransfer.rskToken = crossTransferEvent.originalTokenAddress
    }
    crossTransfer.amount = decimal.fromBigInt(crossTransferEvent.amount, crossTransferEvent.decimals)
    crossTransfer.createdAtTx = crossTransferEvent.transaction.id
    crossTransfer.createdAtTimestamp = crossTransferEvent.transaction.timestamp
    crossTransfer.rskUser = crossTransferEvent.transaction.from
    crossTransfer.sourceChainTransactionHash = crossTransferEvent.sourceChainTransactionHash
    // TODO: if token is native to RSK, then symbol should be from token entity and not side token
    crossTransfer.symbol = crossTransferEvent.symbol
    crossTransfer.sender = crossTransferEvent.sender
    crossTransfer.externalChain = crossTransferEvent.externalChain
  }
  if (crossTransferEvent.status == CrossStatus.Voting) {
    crossTransfer.votes = crossTransfer.votes + 1
  }
  crossTransfer.updatedAtTx = crossTransferEvent.transaction.id
  crossTransfer.updatedAtTimestamp = crossTransferEvent.transaction.timestamp
  crossTransfer.save()
  return crossTransfer
}
