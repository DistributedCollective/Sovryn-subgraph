import { log } from '@graphprotocol/graph-ts'
import {
  Cross as CrossEvent,
  FederationChanged as FederationChangedEvent,
  NewSideToken as NewSideTokenEvent,
  Paused as PausedEvent,
  PauserAdded as PauserAddedEvent,
  PauserRemoved as PauserRemovedEvent,
  PrefixUpdated as PrefixUpdatedEvent,
  Unpaused as UnpausedEvent,
  Upgrading as UpgradingEvent,
} from '../generated/BridgeETH/Bridge'
import { Federation as FederationTemplate } from '../generated/templates'
import { createAndReturnBridge, createAndReturnFederation, createAndReturnSideToken, getBridgeChain } from './utils/CrossChainBridge'
import { createAndReturnCrossTransfer, CrossTransferEvent } from './utils/CrossTransfer'
import { createAndReturnTransaction } from './utils/Transaction'
import { CrossDirection, CrossStatus } from './utils/types'
import { Federation, Bridge } from '../generated/schema'

export function handleCross(event: CrossEvent): void {
  createAndReturnBridge(event.address, event, [])
  const transaction = createAndReturnTransaction(event)
  const crossTransferEvent: CrossTransferEvent = {
    id: '',
    receiver: event.params._to,
    bridgeAddress: event.address.toHex(),
    originalTokenAddress: event.params._tokenAddress.toHexString(),
    amount: event.params._amount,
    decimals: event.params._decimals,
    granularity: event.params._granularity,
    status: CrossStatus.Executed,
    direction: CrossDirection.Outgoing,
    externalChain: getBridgeChain(event.address.toHexString()),
    sender: event.transaction.from.toHexString(),
    symbol: event.params._symbol,
    sourceChainTransactionHash: event.transaction.hash.toHexString(),
    transaction,
  }
  const crossTransfer = createAndReturnCrossTransfer(crossTransferEvent)
  crossTransfer.save()
}

export function handleFederationChanged(event: FederationChangedEvent): void {
  const transaction = createAndReturnTransaction(event)
  FederationTemplate.create(event.params._newFederation)
  log.info('Federation created: {}', [event.params._newFederation.toHex()])
  const oldFederation = Federation.load(event.address.toHexString())
  if (oldFederation != null) {
    oldFederation.isActive = false
    oldFederation.updatedAtTx = transaction.id
    oldFederation.save()
  }
  createAndReturnFederation(event.params._newFederation, event, event.address)
}

export function handleNewSideToken(event: NewSideTokenEvent): void {
  /** When a incoming token is a token that does not exist on Sovryn yet a new token is created
  and the new token is called a SideToken so if you transfer BNB across the bridge from BSC to RSK
  on RSK side a new contract is deployed a new token called BNBes is created
  this event is fired when the new token is deployed on RSK side */

  const transaction = createAndReturnTransaction(event)
  // store sideToken with both original AND new address as ID so we can fetch it later by either one
  createAndReturnSideToken(event.params._newSideTokenAddress, event, transaction)
  createAndReturnSideToken(event.params._originalTokenAddress, event, transaction)
}

export function handlePaused(event: PausedEvent): void {
  const transaction = createAndReturnTransaction(event)
  const bridge = Bridge.load(event.address.toHexString())
  if (bridge != null) {
    bridge.isPaused = true
    bridge.updatedAtTx = transaction.id
    bridge.save()
  }
}

export function handlePauserAdded(event: PauserAddedEvent): void {
  createAndReturnTransaction(event)
  createAndReturnBridge(event.address, event, [event.params.account])
}

export function handlePauserRemoved(event: PauserRemovedEvent): void {
  const transaction = createAndReturnTransaction(event)
  const bridge = Bridge.load(event.address.toHexString())
  if (bridge != null) {
    const pausers = bridge.pausers
    pausers.splice(pausers.indexOf(event.params.account), 1)
    bridge.pausers = pausers
    bridge.updatedAtTx = transaction.id
    bridge.save()
  }
}

export function handlePrefixUpdated(event: PrefixUpdatedEvent): void {
  const transaction = createAndReturnTransaction(event)
  // TODO: check if this event is ever fired, if not remove this logic and these fields from the bridge
  const bridge = Bridge.load(event.address.toHexString())
  if (bridge != null) {
    bridge.prefix = event.params._prefix
    bridge.isSuffix = event.params._isSuffix
    bridge.updatedAtTx = transaction.id
    bridge.save()
  }
}

export function handleUnpaused(event: UnpausedEvent): void {
  const transaction = createAndReturnTransaction(event)
  const bridge = Bridge.load(event.address.toHexString())
  if (bridge != null) {
    bridge.isPaused = false
    bridge.updatedAtTx = transaction.id
    bridge.save()
  }
}

export function handleUpgrading(event: UpgradingEvent): void {
  const transaction = createAndReturnTransaction(event)
  const bridge = Bridge.load(event.address.toHexString())
  if (bridge != null) {
    bridge.isUpgrading = event.params.isUpgrading
    bridge.updatedAtTx = transaction.id
    bridge.save()
  }
}
