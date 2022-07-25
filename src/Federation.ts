import { log } from '@graphprotocol/graph-ts'
import {
  BridgeChanged as BridgeChangedEvent,
  Executed as ExecutedEvent,
  MemberAddition as MemberAdditionEvent,
  MemberRemoval as MemberRemovalEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  RequirementChange as RequirementChangeEvent,
  RevokeTxAndVote as RevokeTxAndVoteEvent,
  StoreFormerFederationExecutedTx as StoreFormerFederationExecutedTxEvent,
  Voted as VotedEvent,
} from '../generated/templates/Federation/Federation'
import {
  BridgeChanged,
  Executed,
  MemberAddition,
  MemberRemoval,
  OwnershipTransferred,
  RequirementChange,
  RevokeTxAndVote,
  StoreFormerFederationExecutedTx,
  Voted,
} from '../generated/schema'

import { createAndReturnTransaction } from './utils/Transaction'
import { createAndReturnFederation } from './utils/CrossChainBridge'

export function handleBridgeChanged(event: BridgeChangedEvent): void {
  let entity = new BridgeChanged(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.bridge = event.params.bridge
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  log.debug('src/Federation.ts ~ Federation.ts ~ 36 ~ info event.address: {}', [event.address.toHex()])
  const federation = createAndReturnFederation(event.address, event)
  federation.bridge = event.params.bridge.toHex()
  federation.updatedAtTx = transaction.id
  federation.save()
}

export function handleExecuted(event: ExecutedEvent): void {
  let entity = new Executed(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.transactionId = event.params.transactionId
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  log.debug('src/Federation.ts ~ Federation.ts ~ 53 ~  event.address: {}', [event.address.toHex()])
  const federation = createAndReturnFederation(event.address, event)
  federation.totalExecuted = federation.totalExecuted + 1
  federation.updatedAtTx = transaction.id
  federation.save()
}

export function handleMemberAddition(event: MemberAdditionEvent): void {
  let entity = new MemberAddition(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.member = event.params.member
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  const federation = createAndReturnFederation(event.address, event)
  const members = federation.members
  members.push(event.params.member)
  federation.members = members
  federation.updatedAtTx = transaction.id
  federation.save()
}

export function handleMemberRemoval(event: MemberRemovalEvent): void {
  let entity = new MemberRemoval(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.member = event.params.member
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  const federation = createAndReturnFederation(event.address, event)
  const members = federation.members
  members.splice(members.indexOf(event.params.member), 1)
  federation.members = members
  federation.updatedAtTx = transaction.id
  federation.save()
}

export function handleRequirementChange(event: RequirementChangeEvent): void {
  let entity = new RequirementChange(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.required = event.params.required
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleRevokeTxAndVote(event: RevokeTxAndVoteEvent): void {
  let entity = new RevokeTxAndVote(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.tx_revoked = event.params.tx_revoked
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  log.debug('src/Federation.ts ~ Federation.ts ~ 110 ~  event.address: {}', [event.address.toHex()])
  const federation = createAndReturnFederation(event.address, event)
  federation.totalVotes = federation.totalVotes + 1
  federation.updatedAtTx = transaction.id
  federation.save()
}

export function handleStoreFormerFederationExecutedTx(event: StoreFormerFederationExecutedTxEvent): void {
  let entity = new StoreFormerFederationExecutedTx(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  // entity.tx_stored = event.params.tx_stored
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleVoted(event: VotedEvent): void {
  let entity = new Voted(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.sender = event.params.sender
  entity.transactionId = event.params.transactionId
  entity.originalTokenAddress = event.params.originalTokenAddress
  entity.receiver = event.params.receiver
  entity.amount = event.params.amount
  entity.symbol = event.params.symbol
  entity.blockHash = event.params.blockHash
  entity.transactionHash = event.params.transactionHash
  entity.logIndex = event.params.logIndex
  entity.decimals = event.params.decimals
  entity.granularity = event.params.granularity
  entity.userData = event.params.userData
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  log.info('src/Federation.ts ~ Federation.ts ~ 143 ~  event.address: {}', [event.address.toHex()])
  const federation = createAndReturnFederation(event.address, event)
  federation.totalVotes = federation.totalVotes + 1
  federation.updatedAtTx = transaction.id
  federation.save()
}
