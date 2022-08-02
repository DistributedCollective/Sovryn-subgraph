import { Address, log } from '@graphprotocol/graph-ts'
import { ZERO_ADDRESS } from '@protofire/subgraph-toolkit'
import {
  AcceptedCrossTransfer as AcceptedCrossTransferEvent,
  AllowTokenChanged as AllowTokenChangedEvent,
  BridgeReceiverStatusChanged as BridgeReceiverStatusChangedEvent,
  Cross as CrossEvent,
  ErrorTokenReceiver as ErrorTokenReceiverEvent,
  FederationChanged as FederationChangedEvent,
  NewSideToken as NewSideTokenEvent,
  Paused as PausedEvent,
  PauserAdded as PauserAddedEvent,
  PauserRemoved as PauserRemovedEvent,
  PrefixUpdated as PrefixUpdatedEvent,
  RevokeTx as RevokeTxEvent,
  SideTokenFactoryChanged as SideTokenFactoryChangedEvent,
  Unpaused as UnpausedEvent,
  Upgrading as UpgradingEvent,
  erc777ConverterSet as erc777ConverterSetEvent,
} from '../generated/Bridge/Bridge'

import { Federation as FederationTemplate } from '../generated/templates'
import {
  createAndReturnBridge,
  createAndReturnCrossTransfer,
  createAndReturnFederation,
  createAndReturnSideToken,
  CrossTransferEvent,
  isETHBridge,
} from './utils/CrossChainBridge'

import { createAndReturnTransaction } from './utils/Transaction'
import { BridgeChain, CrossDirection, CrossStatus } from './utils/types'

export function handleAcceptedCrossTransfer(event: AcceptedCrossTransferEvent): void {}

export function handleAllowTokenChanged(event: AllowTokenChangedEvent): void {}

export function handleBridgeReceiverStatusChanged(event: BridgeReceiverStatusChangedEvent): void {}

export function handleCross(event: CrossEvent): void {
  let transaction = createAndReturnTransaction(event)

  const crossTransferEvent: CrossTransferEvent = {
    receiver: event.params._to,
    originalTokenAddress: event.params._tokenAddress,
    amount: event.params._amount,
    decimals: event.params._decimals,
    granularity: event.params._granularity,
    // userData: event.params._userData,
    status: CrossStatus.Executed,
    direction: CrossDirection.Outgoing,
    timestamp: event.block.timestamp,
    transaction,
  }

  const crossTransfer = createAndReturnCrossTransfer(crossTransferEvent)
  crossTransfer.symbol = event.params._symbol
  crossTransfer.sourceChain = BridgeChain.RSK
  const destinationChain = isETHBridge(event.address.toHex()) ? BridgeChain.ETH : BridgeChain.BSC
  crossTransfer.destinationChain = destinationChain
  crossTransfer.sourceChainBlockHash = event.block.hash
  crossTransfer.sourceChainTransactionHash = event.transaction.hash
  crossTransfer.updatedAtTx = transaction.id
  crossTransfer.updatedAtTimestamp = transaction.timestamp
  crossTransfer.save()
}

export function handleErrorTokenReceiver(event: ErrorTokenReceiverEvent): void {}

export function handleFederationChanged(event: FederationChangedEvent): void {
  let transaction = createAndReturnTransaction(event)

  FederationTemplate.create(event.params._newFederation)
  log.debug('Federation created: {}', [event.params._newFederation.toHex()])
  const bridge = createAndReturnBridge(event.address, event)
  const oldFederationAddress = bridge.federation
  if (oldFederationAddress != ZERO_ADDRESS) {
    const oldFederation = createAndReturnFederation(Address.fromString(oldFederationAddress), event)
    oldFederation.isActive = false
    oldFederation.updatedAtTx = transaction.id
    oldFederation.save()
  }
  bridge.federation = event.params._newFederation.toHex()
  bridge.updatedAtTx = transaction.id
  bridge.save()

  const federation = createAndReturnFederation(event.params._newFederation, event)
  federation.bridge = bridge.id
  federation.updatedAtTx = transaction.id
  federation.save()
}

export function handleNewSideToken(event: NewSideTokenEvent): void {
  // when a incoming token is a token that does not exist on Sovryn yet a new token is created
  // and the new token is called a SideToken so if you transfer BNB across the bridge from BSC to RSK
  // on RSK side a new contract is deployed a new token called BNBes is created
  // this event is fired when the new token is deployed on RSK side

  let transaction = createAndReturnTransaction(event)
  // store sideToken with both original AND new address as ID so we can fetch it later by either one
  createAndReturnSideToken(event.params._newSideTokenAddress, event, transaction)
  createAndReturnSideToken(event.params._originalTokenAddress, event, transaction)
}

export function handlePaused(event: PausedEvent): void {
  let transaction = createAndReturnTransaction(event)

  const bridge = createAndReturnBridge(event.address, event)
  bridge.isPaused = true
  bridge.updatedAtTx = transaction.id
  bridge.save()
}

export function handlePauserAdded(event: PauserAddedEvent): void {
  let transaction = createAndReturnTransaction(event)

  const bridge = createAndReturnBridge(event.address, event)
  const pausers = bridge.pausers
  pausers.push(event.params.account)
  bridge.pausers = pausers
  bridge.updatedAtTx = transaction.id
  bridge.save()
}

export function handlePauserRemoved(event: PauserRemovedEvent): void {
  let transaction = createAndReturnTransaction(event)

  const bridge = createAndReturnBridge(event.address, event)
  const pausers = bridge.pausers
  pausers.splice(pausers.indexOf(event.params.account), 1)
  bridge.pausers = pausers
  bridge.updatedAtTx = transaction.id
  bridge.save()
}

export function handlePrefixUpdated(event: PrefixUpdatedEvent): void {
  let transaction = createAndReturnTransaction(event)
  // TODO: check if this event is ever fired, if not remove this logic and these fields from the bridge
  const bridge = createAndReturnBridge(event.address, event)
  bridge.prefix = event.params._prefix
  bridge.isSuffix = event.params._isSuffix
  bridge.updatedAtTx = transaction.id
  bridge.save()
}

// the tx_revoked param in this event is ID generated by the bridge which is a different
// ID then the one generated by the Federation contract (which we use as the CrossTransfer ID)
// and therefor cannot be used
export function handleRevokeTx(event: RevokeTxEvent): void {}

export function handleSideTokenFactoryChanged(event: SideTokenFactoryChangedEvent): void {}

export function handleUnpaused(event: UnpausedEvent): void {
  let transaction = createAndReturnTransaction(event)

  const bridge = createAndReturnBridge(event.address, event)
  bridge.isPaused = false
  bridge.updatedAtTx = transaction.id
  bridge.save()
}

export function handleUpgrading(event: UpgradingEvent): void {
  let transaction = createAndReturnTransaction(event)

  const bridge = createAndReturnBridge(event.address, event)
  bridge.isUpgrading = event.params.isUpgrading
  bridge.updatedAtTx = transaction.id
  bridge.save()
}

export function handleerc777ConverterSet(event: erc777ConverterSetEvent): void {}
