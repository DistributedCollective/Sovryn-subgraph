import { BigInt, Address, ethereum, Bytes, crypto, ByteArray } from '@graphprotocol/graph-ts'
import { decimal } from '@protofire/subgraph-toolkit'
import { Federation, Bridge, CrossTransfer, Token } from '../../generated/schema'
import { createAndReturnTransaction } from './Transaction'
import { AcceptedCrossTransfer as AcceptedCrossTransferEvent, Cross as CrossEvent } from '../../generated/Bridge/Bridge'
import { CrossDirection, CrossStatus } from './types'
import { createAndReturnUser } from './User'

export const getTransactionId = (
  tokenAddress: Address,
  receiver: Address,
  amount: BigInt,
  // symbol: string,
  decimals: i32,
  granularity: BigInt,
  userData: Bytes,
): ByteArray => {
  return crypto.keccak256(
    Bytes.fromUTF8(
      tokenAddress.toHex() +
        '-' +
        receiver.toHex() +
        '-' +
        amount.toHex() +
        '-' +
        // symbol +
        // '-' +
        decimals.toString() +
        '-' +
        granularity.toHex() +
        '-' +
        userData.toHex(),
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
    const tx = createAndReturnTransaction(event)
    federation.createdAtTx = tx.id
    federation.save()
  }
  return federation
}

export const createAndReturnCrossTransferFromCrossEvent = (event: CrossEvent): CrossTransfer => {
  const transactionId = getTransactionId(
    event.params._tokenAddress,
    event.params._to,
    event.params._amount,
    // event.params._symbol,
    event.params._decimals,
    event.params._granularity,
    event.params._userData,
  )

  let crossTransfer = CrossTransfer.load(transactionId.toHex())
  if (crossTransfer == null) {
    const token = Token.load(event.params._tokenAddress.toHex())

    crossTransfer = new CrossTransfer(transactionId.toHex())
    crossTransfer.direction = CrossDirection.Outgoing
    crossTransfer.votes = 0
    crossTransfer.status = CrossStatus.Voting
    crossTransfer.tokenAddress = event.params._tokenAddress
    crossTransfer.token = token != null ? token.id : null
    const user = createAndReturnUser(event.params._to, event.block.timestamp)
    crossTransfer.to = user.id
    crossTransfer.amount = decimal.fromBigInt(event.params._amount, event.params._decimals)
    crossTransfer.symbol = event.params._symbol
    crossTransfer.createdAtTx = event.transaction.hash.toHex()
    crossTransfer.updatedAtTx = event.transaction.hash.toHex()
    crossTransfer.save()
  }

  return crossTransfer
}

export const createAndReturnCrossTransferFromAcceptedCrossTransfer = (event: AcceptedCrossTransferEvent): CrossTransfer => {
  const transactionId = getTransactionId(
    event.params._tokenAddress,
    event.params._to,
    event.params._amount,
    /* event.params._symbol,*/
    event.params._decimals,
    event.params._granularity,
    event.params._userData,
  )
  let crossTransfer = CrossTransfer.load(transactionId.toHex())
  if (crossTransfer == null) {
    const token = Token.load(event.params._tokenAddress.toHex())
    crossTransfer = new CrossTransfer(transactionId.toHex())
    crossTransfer.direction = CrossDirection.Incoming
    // TODO: better status for incoming transfers
    crossTransfer.status = CrossStatus.Executed
    crossTransfer.tokenAddress = event.params._tokenAddress
    crossTransfer.token = token != null ? token.id : null
    const user = createAndReturnUser(event.params._to, event.block.timestamp)
    crossTransfer.to = user.id
    crossTransfer.amount = decimal.fromBigInt(event.params._amount, event.params._decimals)
    crossTransfer.symbol = token != null ? token.symbol : null
    crossTransfer.updatedAtTx = event.transaction.hash.toHex()
    crossTransfer.createdAtTx = event.transaction.hash.toHex()
    crossTransfer.save()
  }
  return crossTransfer
}
