import { Address, Bytes, ethereum } from '@graphprotocol/graph-ts'
import { ZERO_ADDRESS } from '@protofire/subgraph-toolkit'
import { Federation, Bridge, SideToken, Transaction } from '../../generated/schema'
import { NewSideToken as NewSideTokenEvent } from '../../generated/BridgeETH/Bridge'
import { Voted as VotedEvent } from '../../generated/templates/Federation/Federation'
import { BridgeChain, BridgeType, CrossDirection, CrossStatus } from './types'
import { bridgeBSC, bridgeETH } from '../contracts/contracts'
import { createAndReturnCrossTransfer, CrossTransferEvent } from './CrossTransfer'

export const createAndReturnBridge = (bridgeAddress: Address, event: ethereum.Event, pausers: Bytes[]): Bridge => {
  let bridge = Bridge.load(bridgeAddress.toHex())
  if (bridge == null) {
    bridge = new Bridge(bridgeAddress.toHex())
    bridge.type = getBridgeType(bridgeAddress.toHexString())
    bridge.isUpgrading = false
    bridge.isPaused = false
    bridge.pausers = pausers
    bridge.federation = ZERO_ADDRESS
    bridge.createdAtTx = event.transaction.hash.toHexString()
    bridge.save()
  }
  return bridge
}

export const createAndReturnFederation = (federationAddress: Address, event: ethereum.Event, bridgeAddress: Address): Federation => {
  let federation = Federation.load(federationAddress.toHex())
  if (federation == null) {
    federation = new Federation(federationAddress.toHex())
    federation.totalExecuted = 0
    federation.totalVotes = 0
    federation.isActive = true
    federation.members = []
    federation.createdAtTx = event.transaction.hash.toHexString()
    federation.updatedAtTx = event.transaction.hash.toHexString()
    federation.bridge = bridgeAddress.toHexString()
    federation.save()
  }
  return federation
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
  const federation = Federation.load(event.address.toHexString())
  if (federation != null) {
    federation.totalVotes = federation.totalVotes + 1
    federation.updatedAtTx = transaction.id
    federation.save()

    const bridgeAddress = federation.bridge
    const crossTransferEvent: CrossTransferEvent = {
      id: event.params.transactionId.toHex(),
      bridgeAddress: federation.bridge,
      receiver: event.params.receiver,
      originalTokenAddress: event.params.originalTokenAddress.toHexString(),
      amount: event.params.amount,
      decimals: event.params.decimals,
      granularity: event.params.granularity,
      externalChain: isETHBridge(bridgeAddress) ? BridgeChain.ETH : BridgeChain.BSC,
      sender: event.params.sender.toHexString(),
      symbol: event.params.symbol,
      sourceChainTransactionHash: event.params.transactionHash.toHexString(),
      status: CrossStatus.Voting,
      direction: CrossDirection.Incoming,
      transaction,
    }
    const crossTransfer = createAndReturnCrossTransfer(crossTransferEvent)
    crossTransfer.save()
  }
}

export function isETHBridge(address: string): boolean {
  return address.toLowerCase() == bridgeETH.toLowerCase()
}

export function isBSCBridge(address: string): boolean {
  return address.toLowerCase() == bridgeBSC.toLowerCase()
}

const bridgeMap = new Map<string, string>()
bridgeMap.set(bridgeETH.toLowerCase(), BridgeType.RSK_ETH)
bridgeMap.set(bridgeBSC.toLowerCase(), BridgeType.RSK_BSC)

export function getBridgeType(address: string): string {
  const bridge = bridgeMap.get(address)
  if (bridge == null) {
    return BridgeType.UNKNOWN
  } else {
    return bridge
  }
}
