import { BigInt, Address, ethereum, crypto, ByteArray, log } from '@graphprotocol/graph-ts'
import { decimal, ZERO_ADDRESS } from '@protofire/subgraph-toolkit'
import { Federation, Bridge, CrossTransfer, SideToken, Transaction } from '../../generated/schema'
import { createAndReturnTransaction } from './Transaction'
import { NewSideToken as NewSideTokenEvent } from '../../generated/BridgeETH/Bridge'
import { Voted as VotedEvent } from '../../generated/templates/Federation/Federation'
import { BridgeChain, BridgeType, CrossDirection, CrossStatus } from './types'
import { createAndReturnUser } from './User'
import { bridgeBSC, bridgeETH } from '../contracts/contracts'

export class CrossTransferEvent {
  id: string = ''
  bridgeAddress: string
  receiver: Address
  originalTokenAddress: Address
  amount: BigInt
  decimals: i32
  granularity: BigInt
  status: string
  direction: string
  timestamp: BigInt
  transaction: Transaction
}

// we create a crossTransferId for outgoing transfers from the params of the cross events
// the id is created this way to simulate the as close as possible (but not exactly) the same id as in the smart contract
export const getCrossTransferId = (crossTransferEvent: CrossTransferEvent): ByteArray => {
  const id = crypto.keccak256(
    ByteArray.fromUTF8(
      crossTransferEvent.originalTokenAddress.toHex() +
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

export const createAndReturnBridge = (bridgeAddress: Address, event: ethereum.Event): Bridge => {
  let bridge = Bridge.load(bridgeAddress.toHex())
  if (bridge == null) {
    bridge = new Bridge(bridgeAddress.toHex())
    if (isETHBridge(bridgeAddress.toHex())) {
      bridge.type = BridgeType.RSK_ETH
    } else if (isBSCBridge(bridgeAddress.toHex())) {
      bridge.type = BridgeType.RSK_BSC
    } else {
      log.warning('Unknown bridge type for bridgeAddress: {}', [bridgeAddress.toHex()])
    }
    bridge.isUpgrading = false
    bridge.isPaused = false
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
  // on votes and executed events (incoming transfers) from the federation we have the ID in the events,
  // on cross events (from the bridge) for outgoing transfers we don't have an id and therefor we have to generate it
  const id = crossTransferEvent.id != '' ? crossTransferEvent.id : getCrossTransferId(crossTransferEvent).toHex()
  let crossTransfer = CrossTransfer.load(id)
  if (crossTransfer == null) {
    crossTransfer = new CrossTransfer(id)
    crossTransfer.direction = crossTransferEvent.direction.toString()
    crossTransfer.votes = 0
    crossTransfer.status = crossTransferEvent.status.toString()
    crossTransfer.receiver = crossTransferEvent.receiver
    crossTransfer.originalTokenAddress = crossTransferEvent.originalTokenAddress
    crossTransfer.rskUser =
      crossTransferEvent.direction == CrossDirection.Incoming ? crossTransferEvent.receiver.toHexString() : crossTransferEvent.transaction.from
    // TODO: get side token
    // const token = Token.load(crossTransferEvent.tokenAddress.toHex())
    crossTransfer.token = crossTransferEvent.originalTokenAddress.toHex()
    // const sideToken = SideToken.load(crossTransferEvent.tokenAddress.toHex())
    crossTransfer.sideToken = crossTransferEvent.originalTokenAddress.toHex()
    crossTransfer.amount = decimal.fromBigInt(crossTransferEvent.amount, crossTransferEvent.decimals)
    crossTransfer.createdAtTx = crossTransferEvent.transaction.id
    crossTransfer.createdAtTimestamp = crossTransferEvent.transaction.timestamp
    crossTransfer.save()
  }
  return crossTransfer
}

export const createAndReturnSideToken = (sideTokenAddress: Address, event: NewSideTokenEvent, transaction: Transaction): SideToken => {
  let sideToken = SideToken.load(sideTokenAddress.toHex())
  if (sideToken == null) {
    sideToken = new SideToken(sideTokenAddress.toHex())
    sideToken.originalTokenAddress = event.params._originalTokenAddress
    sideToken.sideTokenAddress = event.params._newSideTokenAddress
    sideToken.newSymbol = event.params._newSymbol
    sideToken.granularity = event.params._granularity
    sideToken.createdAtTx = transaction.id
    sideToken.updatedAtTx = transaction.id
    sideToken.save()
  }
  return sideToken
}

export const handleFederatorVoted = (event: VotedEvent, transaction: Transaction): void => {
  const federation = createAndReturnFederation(event.address, event)
  federation.totalVotes = federation.totalVotes + 1
  federation.updatedAtTx = transaction.id
  federation.save()

  const crossTransferEvent: CrossTransferEvent = {
    id: event.params.transactionId.toHex(),
    bridgeAddress: federation.bridge,
    receiver: event.params.receiver,
    originalTokenAddress: event.params.originalTokenAddress,
    amount: event.params.amount,
    decimals: event.params.decimals,
    granularity: event.params.granularity,
    // userData: event.params.userData,
    status: CrossStatus.Voting,
    direction: CrossDirection.Incoming,
    timestamp: event.block.timestamp,
    transaction,
  }
  const crossTransfer = createAndReturnCrossTransfer(crossTransferEvent)
  createAndReturnUser(event.transaction.from, event.block.timestamp)
  crossTransfer.sourceChainTransactionHash = event.params.transactionHash
  crossTransfer.sourceChainBlockHash = event.params.blockHash
  // TODO: tokenAddress might not be a side token but rather a token that is "native" to RSK (WRBTC, SOV etc.) need to check
  const sideToken = SideToken.load(event.params.originalTokenAddress.toHex())
  if (sideToken != null) {
    crossTransfer.tokenAddress = sideToken.sideTokenAddress
  }
  // TODO: if token is native to RSK, then symbol should be from token entity and not side token
  crossTransfer.symbol = event.params.symbol
  crossTransfer.sender = event.params.sender
  crossTransfer.votes = crossTransfer.votes + 1

  const bridgeAddress = federation.bridge
  crossTransfer.destinationChain = BridgeChain.RSK
  crossTransfer.sourceChain = isETHBridge(bridgeAddress) ? BridgeChain.ETH : BridgeChain.BSC
  crossTransfer.updatedAtTx = transaction.id
  crossTransfer.updatedAtTimestamp = transaction.timestamp
  crossTransfer.save()
}

export function isETHBridge(address: string): boolean {
  return address.toLowerCase() == bridgeETH.toLowerCase()
}

export function isBSCBridge(address: string): boolean {
  return address.toLowerCase() == bridgeBSC.toLowerCase()
}
