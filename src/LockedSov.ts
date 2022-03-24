import { BigInt } from '@graphprotocol/graph-ts'
import { Deposited as DepositedEvent, TokenStaked as TokenStakedEvent } from '../generated/LockedSov/LockedSov'
import { Deposited, UserRewardsEarnedHistory, RewardsEarnedHistoryItem } from '../generated/schema'

import { loadTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'

export function handleTokenStaked(event: TokenStakedEvent): void {
  createAndReturnUser(event.params._initiator)
  let userRewardsEarnedHistory = UserRewardsEarnedHistory.load(event.params._initiator.toHexString())
  if (userRewardsEarnedHistory != null) {
    userRewardsEarnedHistory.availableTradingRewards = BigInt.zero()
    userRewardsEarnedHistory.save()
  } else {
    userRewardsEarnedHistory = new UserRewardsEarnedHistory(event.params._initiator.toHexString())
    userRewardsEarnedHistory.availableRewardSov = BigInt.zero()
    userRewardsEarnedHistory.availableTradingRewards = BigInt.zero()
    userRewardsEarnedHistory.totalFeesAndRewardsEarned = BigInt.zero()
    userRewardsEarnedHistory.user = event.params._initiator.toHexString()
    userRewardsEarnedHistory.save()
  }

  let rewardsEarnedHistoryItem = new RewardsEarnedHistoryItem(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  rewardsEarnedHistoryItem.action = 'RewardSovStaked'
  rewardsEarnedHistoryItem.user = event.params._initiator.toHexString()
  rewardsEarnedHistoryItem.amount = event.params._amount
  rewardsEarnedHistoryItem.timestamp = event.block.timestamp
  rewardsEarnedHistoryItem.transaction = event.transaction.hash.toHexString()
  rewardsEarnedHistoryItem.save()
}
