import { BigInt, Address, ethereum, Bytes, crypto, ByteArray } from '@graphprotocol/graph-ts'
import { decimal, ZERO_ADDRESS } from '@protofire/subgraph-toolkit'
import { Federation, Bridge, CrossTransfer, Token, SideToken, Transaction } from '../../generated/schema'
import { createAndReturnTransaction } from './Transaction'
import { AcceptedCrossTransfer as AcceptedCrossTransferEvent, Cross as CrossEvent } from '../../generated/Bridge/Bridge'
import { CrossDirection, CrossStatus } from './types'
import { createAndReturnUser } from './User'

export class CrossTransferEvent {
  receiver: Address
  tokenAddress: Address
  amount: BigInt
  // symbol?: string
  decimals: i32
  granularity: BigInt
  userData: Bytes
  status: string
  direction: string
  timestamp: BigInt
  transaction: Transaction
}

export const getCrossTransferId = (crossTransferEvent: CrossTransferEvent): ByteArray => {
  return crypto.keccak256(
    Bytes.fromUTF8(
      crossTransferEvent.tokenAddress.toHex() +
        '-' +
        crossTransferEvent.receiver.toHex() +
        '-' +
        crossTransferEvent.amount.toHex() +
        '-' +
        // symbol +
        // '-' +
        crossTransferEvent.decimals.toString() +
        '-' +
        crossTransferEvent.granularity.toHex() +
        '-' +
        crossTransferEvent.userData.toHex(),
    ),
  )
}

export const createAndReturnBridge = (bridgeAddress: Address, event: ethereum.Event): Bridge => {
  let bridge = Bridge.load(bridgeAddress.toHex())
  if (bridge == null) {
    bridge = new Bridge(bridgeAddress.toHex())
    // TODO: get bridge type dynamically
    bridge.type = 'RSK_BSC'
    bridge.isUpgrading = false
    bridge.isPaused = false
    bridge.totalFundsReceived = BigInt.zero()
    bridge.totalFundsReceived = BigInt.zero()
    bridge.feesCollected = BigInt.zero()
    bridge.federation = ZERO_ADDRESS
    const tx = createAndReturnTransaction(event)
    bridge.createdAtTx = tx.id
    bridge.save()
  }
  return bridge
}

export const createAndReturnFederation = (federationAddress: Address, event: ethereum.Event): Federation => {
  let federation = Federation.load(federationAddress.toHex())
  if (federation == null) {
    federation = new Federation(federationAddress.toHex())
    federation.totalExecuted = 0
    federation.totalVotes = 0
    federation.isActive = true
    const tx = createAndReturnTransaction(event)
    federation.createdAtTx = tx.id
    federation.save()
  }
  return federation
}

export const createAndReturnCrossTransfer = (crossTransferEvent: CrossTransferEvent): CrossTransfer => {
  const id = getCrossTransferId(crossTransferEvent)
  let crossTransfer = CrossTransfer.load(id.toHex())
  if (crossTransfer == null) {
    crossTransfer = new CrossTransfer(id.toHex())
    crossTransfer.direction = crossTransferEvent.direction.toString()
    crossTransfer.votes = 0
    crossTransfer.status = crossTransferEvent.status.toString()
    const user = createAndReturnUser(crossTransferEvent.receiver, crossTransferEvent.timestamp)
    crossTransfer.receiver = user.id
    crossTransfer.tokenAddress = crossTransferEvent.tokenAddress
    // TODO: get side token
    // const token = Token.load(crossTransferEvent.tokenAddress.toHex())
    crossTransfer.token = crossTransferEvent.tokenAddress.toHex()
    // const sideToken = SideToken.load(crossTransferEvent.tokenAddress.toHex())
    crossTransfer.sideToken = crossTransferEvent.tokenAddress.toHex()
    crossTransfer.amount = decimal.fromBigInt(crossTransferEvent.amount, crossTransferEvent.decimals)
    crossTransfer.createdAtTx = crossTransferEvent.transaction.id
    crossTransfer.createdAtTimestamp = crossTransferEvent.transaction.timestamp
    crossTransfer.save()
  }
  return crossTransfer
}
