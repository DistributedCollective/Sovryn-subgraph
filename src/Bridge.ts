import { log } from '@graphprotocol/graph-ts'
import {
  AcceptedCrossTransfer as AcceptedCrossTransferEvent,
  AllowTokenChanged as AllowTokenChangedEvent,
  BridgeReceiverStatusChanged as BridgeReceiverStatusChangedEvent,
  Cross as CrossEvent,
  ErrorTokenReceiver as ErrorTokenReceiverEvent,
  FederationChanged as FederationChangedEvent,
  NewSideToken as NewSideTokenEvent,
  // OwnershipTransferred as OwnershipTransferredEvent,
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
import {
  AcceptedCrossTransfer,
  AllowTokenChanged,
  BridgeReceiverStatusChanged,
  Cross,
  ErrorTokenReceiver,
  FederationChanged,
  NewSideToken,
  // OwnershipTransferred,
  Paused,
  PauserAdded,
  PauserRemoved,
  PrefixUpdated,
  RevokeTx,
  SideTokenFactoryChanged,
  Unpaused,
  Upgrading,
  erc777ConverterSet,
} from '../generated/schema'

import { Federation as FederationTemplate } from '../generated/templates'
import { createAndReturnBridge, createAndReturnCrossTransfer, createAndReturnFederation, CrossTransferEvent } from './utils/CrossChainBridge'

import { createAndReturnTransaction } from './utils/Transaction'
import { BridgeChain, CrossDirection, CrossStatus } from './utils/types'

export function handleAcceptedCrossTransfer(event: AcceptedCrossTransferEvent): void {
  let entity = new AcceptedCrossTransfer(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._tokenAddress = event.params._tokenAddress
  entity._to = event.params._to
  entity._amount = event.params._amount
  entity._decimals = event.params._decimals
  entity._granularity = event.params._granularity
  entity._formattedAmount = event.params._formattedAmount
  entity._calculatedDecimals = event.params._calculatedDecimals
  entity._calculatedGranularity = event.params._calculatedGranularity
  entity._userData = event.params._userData
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  const crossTransferEvent: CrossTransferEvent = {
    receiver: event.params._to,
    tokenAddress: event.params._tokenAddress,
    amount: event.params._amount,
    decimals: event.params._decimals,
    granularity: event.params._granularity,
    userData: event.params._userData,
    status: CrossStatus.Executed,
    direction: CrossDirection.Incoming,
    timestamp: event.block.timestamp,
    transaction,
  }
  const crossTransfer = createAndReturnCrossTransfer(crossTransferEvent)
  // TODO: find a way to tell if it is rsk bsc bridge or rsk ETH bridge
  crossTransfer.sourceChain = BridgeChain.BSC
  crossTransfer.destinationChain = BridgeChain.RSK
  crossTransfer.updatedAtTx = transaction.id
  crossTransfer.updatedAtTimestamp = transaction.timestamp
  crossTransfer.save()
  // createAndReturnCrossTransferFromAcceptedCrossTransfer(event)
}

export function handleAllowTokenChanged(event: AllowTokenChangedEvent): void {
  let entity = new AllowTokenChanged(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._newAllowToken = event.params._newAllowToken
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleBridgeReceiverStatusChanged(event: BridgeReceiverStatusChangedEvent): void {
  let entity = new BridgeReceiverStatusChanged(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.bridgeReceiver = event.params.bridgeReceiver
  entity.newStatus = event.params.newStatus
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleCross(event: CrossEvent): void {
  let entity = new Cross(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._tokenAddress = event.params._tokenAddress
  entity._to = event.params._to
  entity._amount = event.params._amount
  entity._symbol = event.params._symbol
  entity._userData = event.params._userData
  entity._decimals = event.params._decimals
  entity._granularity = event.params._granularity
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  const crossTransferEvent: CrossTransferEvent = {
    receiver: event.params._to,
    tokenAddress: event.params._tokenAddress,
    amount: event.params._amount,
    decimals: event.params._decimals,
    granularity: event.params._granularity,
    userData: event.params._userData,
    status: CrossStatus.Executed,
    direction: CrossDirection.Outgoing,
    timestamp: event.block.timestamp,
    transaction,
  }

  const crossTransfer = createAndReturnCrossTransfer(crossTransferEvent)
  crossTransfer.symbol = event.params._symbol
  crossTransfer.sourceChain = BridgeChain.RSK
  // TODO: find a way to tell if it is rsk bsc bridge or rsk ETH bridge
  crossTransfer.destinationChain = BridgeChain.BSC
  crossTransfer.updatedAtTx = transaction.id
  crossTransfer.updatedAtTimestamp = transaction.timestamp
  crossTransfer.save()
}

export function handleErrorTokenReceiver(event: ErrorTokenReceiverEvent): void {
  let entity = new ErrorTokenReceiver(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._errorData = event.params._errorData
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleFederationChanged(event: FederationChangedEvent): void {
  let entity = new FederationChanged(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._newFederation = event.params._newFederation
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  FederationTemplate.create(event.params._newFederation)
  log.debug('Federation created: {}', [event.params._newFederation.toHex()])
  const bridge = createAndReturnBridge(event.address, event)
  bridge.updatedAtTx = transaction.id
  bridge.save()

  const federation = createAndReturnFederation(event.params._newFederation, event)
  federation.bridge = bridge.id
  federation.updatedAtTx = transaction.id
  federation.save()
}

export function handleNewSideToken(event: NewSideTokenEvent): void {
  // TODO: create side token entity, if cross transfer is of side token how to store it to CrossTransfer entity?
  let entity = new NewSideToken(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._newSideTokenAddress = event.params._newSideTokenAddress
  entity._originalTokenAddress = event.params._originalTokenAddress
  entity._newSymbol = event.params._newSymbol
  entity._granularity = event.params._granularity
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

// export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {
//   let entity = new OwnershipTransferred(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
//   entity.previousOwner = event.params.previousOwner
//   entity.newOwner = event.params.newOwner
//   let transaction = createAndReturnTransaction(event)
//   entity.transaction = transaction.id
//   entity.timestamp = transaction.timestamp
//   entity.emittedBy = event.address
//   entity.save()

//   const bridge = createAndReturnBridge(event.address, event)
//   bridge.owner = event.params.newOwner
//   bridge.updatedAtTx = transaction.id
//   bridge.save()
// }

export function handlePaused(event: PausedEvent): void {
  let entity = new Paused(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.account = event.params.account
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  const bridge = createAndReturnBridge(event.address, event)
  bridge.isPaused = true
  bridge.updatedAtTx = transaction.id
  bridge.save()
}

export function handlePauserAdded(event: PauserAddedEvent): void {
  let entity = new PauserAdded(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.account = event.params.account
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  const bridge = createAndReturnBridge(event.address, event)
  const pausers = bridge.pausers
  pausers.push(event.params.account)
  bridge.pausers = pausers
  bridge.updatedAtTx = transaction.id
  bridge.save()
}

export function handlePauserRemoved(event: PauserRemovedEvent): void {
  let entity = new PauserRemoved(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.account = event.params.account
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  const bridge = createAndReturnBridge(event.address, event)
  const pausers = bridge.pausers
  pausers.splice(pausers.indexOf(event.params.account), 1)
  bridge.pausers = pausers
  bridge.updatedAtTx = transaction.id
  bridge.save()
}

export function handlePrefixUpdated(event: PrefixUpdatedEvent): void {
  let entity = new PrefixUpdated(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._isSuffix = event.params._isSuffix
  entity._prefix = event.params._prefix
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  // TODO: check if this event is ever fired, if not remove this logic and these fields from the bridge
  const bridge = createAndReturnBridge(event.address, event)
  bridge.prefix = event.params._prefix
  bridge.isSuffix = event.params._isSuffix
  bridge.updatedAtTx = transaction.id
  bridge.save()
}

export function handleRevokeTx(event: RevokeTxEvent): void {
  let entity = new RevokeTx(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.tx_revoked = event.params.tx_revoked
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

// export function handleSideTokenFactoryChanged(event: SideTokenFactoryChangedEvent): void {
//   let entity = new SideTokenFactoryChanged(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
//   entity._newSideTokenFactory = event.params._newSideTokenFactory
//   let transaction = createAndReturnTransaction(event)
//   entity.transaction = transaction.id
//   entity.timestamp = transaction.timestamp
//   entity.emittedBy = event.address
//   entity.save()
// }

export function handleUnpaused(event: UnpausedEvent): void {
  let entity = new Unpaused(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.account = event.params.account
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  const bridge = createAndReturnBridge(event.address, event)
  bridge.isPaused = false
  bridge.updatedAtTx = transaction.id
  bridge.save()
}

export function handleUpgrading(event: UpgradingEvent): void {
  let entity = new Upgrading(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.isUpgrading = event.params.isUpgrading
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  const bridge = createAndReturnBridge(event.address, event)
  bridge.isUpgrading = event.params.isUpgrading
  bridge.updatedAtTx = transaction.id
  bridge.save()
}

export function handleerc777ConverterSet(event: erc777ConverterSetEvent): void {
  let entity = new erc777ConverterSet(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.erc777ConverterAddress = event.params.erc777ConverterAddress
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}
