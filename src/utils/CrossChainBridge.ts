import { Address, ethereum, log } from '@graphprotocol/graph-ts'
import { ZERO_ADDRESS } from '@protofire/subgraph-toolkit'
import { Federation, Bridge, SideToken, Transaction } from '../../generated/schema'
import { NewSideToken as NewSideTokenEvent } from '../../generated/BridgeETH/Bridge'
import { Voted as VotedEvent } from '../../generated/templates/Federation/Federation'
import { BridgeChain, BridgeType, CrossDirection, CrossStatus } from './types'
import { bridgeBSC, bridgeETH } from '../contracts/contracts'
import { createAndReturnCrossTransfer, CrossTransferEvent } from './CrossTransfer'

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
    bridge.pausers = []
    bridge.federation = ZERO_ADDRESS
    bridge.createdAtTx = event.transaction.hash.toHexString()
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
    federation.createdAtTx = event.transaction.hash.toHexString()
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
  const federation = createAndReturnFederation(event.address, event)
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

export function isETHBridge(address: string): boolean {
  return address.toLowerCase() == bridgeETH.toLowerCase()
}

export function isBSCBridge(address: string): boolean {
  return address.toLowerCase() == bridgeBSC.toLowerCase()
}
