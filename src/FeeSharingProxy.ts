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
import { StakeHistoryItem } from '../generated/schema'

import { loadTransaction } from './utils/Transaction'

export function handleCheckpointAdded(event: CheckpointAddedEvent): void {}

export function handleFeeAMMWithdrawn(event: FeeAMMWithdrawnEvent): void {}

export function handleFeeWithdrawn(event: FeeWithdrawnEvent): void {}

export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {}

export function handleTokensTransferred(event: TokensTransferredEvent): void {
  /** If this event occurs in the same transaction as a StakingWithdrawn or TokensWithdrawn event on the staking contract, it means the user unstaked their SOV early
   * This event is emitted when the "slashing" penalty for early unstaking occurs
   */
  let stakeHistoryEntity = StakeHistoryItem.load(event.transaction.hash.toHexString())
  if (stakeHistoryEntity != null) {
    stakeHistoryEntity.action = 'Unstake'
    stakeHistoryEntity.save()
  }
}

export function handleUnwhitelistedConverter(event: UnwhitelistedConverterEvent): void {}

export function handleUserFeeWithdrawn(event: UserFeeWithdrawnEvent): void {
  loadTransaction(event)
  let stakeHistoryItem = new StakeHistoryItem(event.params.sender.toHexString())
  stakeHistoryItem.user = event.params.sender.toHexString()
  stakeHistoryItem.action = 'FeeWithdrawn'
  stakeHistoryItem.timestamp = event.block.timestamp
  stakeHistoryItem.amount = event.params.amount
  stakeHistoryItem.transaction = event.transaction.hash.toHexString()
  stakeHistoryItem.save()
}

export function handleWhitelistedConverter(event: WhitelistedConverterEvent): void {}
