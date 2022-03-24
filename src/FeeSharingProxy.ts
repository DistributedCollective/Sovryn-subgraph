import {
  CheckpointAdded as CheckpointAddedEvent,
  FeeAMMWithdrawn as FeeAMMWithdrawnEvent,
  FeeWithdrawn as FeeWithdrawnEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  TokensTransferred as TokensTransferredEvent,
  UnwhitelistedConverter as UnwhitelistedConverterEvent,
  UserFeeWithdrawn as UserFeeWithdrawnEvent,
  WhitelistedConverter as WhitelistedConverterEvent,
} from '../generated/FeeSharingProxy/FeeSharingProxy'
import { FeeAMMWithdrawn, FeeWithdrawn, StakeHistoryItem, TokensTransferred, UserFeeWithdrawn } from '../generated/schema'

import { loadTransaction } from './utils/Transaction'

export function handleCheckpointAdded(event: CheckpointAddedEvent): void {}

export function handleFeeAMMWithdrawn(event: FeeAMMWithdrawnEvent): void {
  let entity = new FeeAMMWithdrawn(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.sender = event.params.sender
  entity.converter = event.params.converter
  entity.amount = event.params.amount
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleFeeWithdrawn(event: FeeWithdrawnEvent): void {
  let entity = new FeeWithdrawn(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.sender = event.params.sender
  entity.token = event.params.token
  entity.amount = event.params.amount
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {}

export function handleTokensTransferred(event: TokensTransferredEvent): void {
  let entity = new TokensTransferred(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.sender = event.params.sender
  entity.token = event.params.token
  entity.amount = event.params.amount
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  let stakeHistoryEntity = StakeHistoryItem.load(event.transaction.hash.toHexString())
  if (stakeHistoryEntity != null) {
    stakeHistoryEntity.action = 'Unstake'
    stakeHistoryEntity.save()
  }
}

export function handleUnwhitelistedConverter(event: UnwhitelistedConverterEvent): void {}

export function handleUserFeeWithdrawn(event: UserFeeWithdrawnEvent): void {
  let entity = new UserFeeWithdrawn(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.sender = event.params.sender
  entity.receiver = event.params.receiver
  entity.token = event.params.token
  entity.amount = event.params.amount
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  let stakeHistoryItem = new StakeHistoryItem(event.params.sender.toHexString())
  stakeHistoryItem.user = event.params.sender.toHexString()
  stakeHistoryItem.action = 'FeeWithdrawn'
  stakeHistoryItem.timestamp = event.block.timestamp
  stakeHistoryItem.amount = event.params.amount
  stakeHistoryItem.transaction = event.transaction.hash.toHexString()
  stakeHistoryItem.save()
}

export function handleWhitelistedConverter(event: WhitelistedConverterEvent): void {}
