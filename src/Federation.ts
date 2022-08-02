import { log } from '@graphprotocol/graph-ts'
import {
  BridgeChanged as BridgeChangedEvent,
  Executed as ExecutedEvent,
  MemberAddition as MemberAdditionEvent,
  MemberRemoval as MemberRemovalEvent,
  // OwnershipTransferred as OwnershipTransferredEvent,
  RequirementChange as RequirementChangeEvent,
  RevokeTxAndVote as RevokeTxAndVoteEvent,
  StoreFormerFederationExecutedTx as StoreFormerFederationExecutedTxEvent,
  Voted as VotedEvent,
} from '../generated/templates/Federation/Federation'
import { CrossTransfer } from '../generated/schema'

import { createAndReturnTransaction } from './utils/Transaction'
import { createAndReturnFederation, handleFederatorVoted } from './utils/CrossChainBridge'
import { CrossStatus } from './utils/types'

export function handleBridgeChanged(event: BridgeChangedEvent): void {
  let transaction = createAndReturnTransaction(event)

  const federation = createAndReturnFederation(event.address, event)
  federation.bridge = event.params.bridge.toHex()
  federation.updatedAtTx = transaction.id
  federation.save()
}

export function handleExecuted(event: ExecutedEvent): void {
  let transaction = createAndReturnTransaction(event)

  const federation = createAndReturnFederation(event.address, event)
  federation.totalExecuted = federation.totalExecuted + 1
  federation.updatedAtTx = transaction.id
  federation.save()

  const crossTransfer = CrossTransfer.load(event.params.transactionId.toHex())
  if (crossTransfer != null) {
    crossTransfer.status = CrossStatus.Executed
    crossTransfer.updatedAtTx = transaction.id
    crossTransfer.updatedAtTimestamp = transaction.timestamp
    crossTransfer.save()
  }
}

export function handleMemberAddition(event: MemberAdditionEvent): void {
  let transaction = createAndReturnTransaction(event)

  const federation = createAndReturnFederation(event.address, event)
  const members = federation.members
  members.push(event.params.member)
  federation.members = members
  federation.updatedAtTx = transaction.id
  federation.save()
}

export function handleMemberRemoval(event: MemberRemovalEvent): void {
  let transaction = createAndReturnTransaction(event)

  const federation = createAndReturnFederation(event.address, event)
  const members = federation.members
  members.splice(members.indexOf(event.params.member), 1)
  federation.members = members
  federation.updatedAtTx = transaction.id
  federation.save()
}

export function handleRequirementChange(event: RequirementChangeEvent): void {}

export function handleRevokeTxAndVote(event: RevokeTxAndVoteEvent): void {
  let transaction = createAndReturnTransaction(event)

  const federation = createAndReturnFederation(event.address, event)
  federation.totalVotes = federation.totalVotes + 1
  federation.updatedAtTx = transaction.id
  federation.save()

  const crossTransfer = CrossTransfer.load(event.params.tx_revoked.toHex())
  if (crossTransfer != null) {
    crossTransfer.status = CrossStatus.Revoked
    crossTransfer.updatedAtTx = transaction.id
    crossTransfer.updatedAtTimestamp = transaction.timestamp
    crossTransfer.save()
  }
}

export function handleStoreFormerFederationExecutedTx(event: StoreFormerFederationExecutedTxEvent): void {}

export function handleVoted(event: VotedEvent): void {
  let transaction = createAndReturnTransaction(event)
  handleFederatorVoted(event, transaction)
}

// this is an old event with a lot of missing data so it is not processed and not suppose to happen
export function handleVotedV0(event: VotedEvent): void {
  let transaction = createAndReturnTransaction(event)

  const federation = createAndReturnFederation(event.address, event)
  federation.totalVotes = federation.totalVotes + 1
  federation.updatedAtTx = transaction.id
  federation.save()
}

export function handleVotedV1(event: VotedEvent): void {
  let transaction = createAndReturnTransaction(event)
  handleFederatorVoted(event, transaction)
}
