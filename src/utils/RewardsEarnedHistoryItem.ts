import { Bytes, Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { RewardsEarnedHistoryItem } from '../../generated/schema'

class CreateOrIncrementRewardParams {
  action: string
  transactionHash: Bytes
  user: Address
  amount: BigDecimal
  timestamp: BigInt
}

export function createOrIncrementRewardItem(params: CreateOrIncrementRewardParams): void {
  // ID here is txHash + reward type
  let rewardsEarnedHistoryItem = RewardsEarnedHistoryItem.load(params.transactionHash.toHexString() + '-' + params.action)
  if (rewardsEarnedHistoryItem == null) {
    rewardsEarnedHistoryItem = new RewardsEarnedHistoryItem(params.transactionHash.toHexString() + '-' + params.action)
    rewardsEarnedHistoryItem.action = params.action
    rewardsEarnedHistoryItem.user = params.user.toHexString()
    rewardsEarnedHistoryItem.amount = params.amount
    rewardsEarnedHistoryItem.timestamp = params.timestamp.toI32()
    rewardsEarnedHistoryItem.transaction = params.transactionHash.toHexString()
    rewardsEarnedHistoryItem.save()
  } else {
    rewardsEarnedHistoryItem.amount = rewardsEarnedHistoryItem.amount.plus(params.amount)
    rewardsEarnedHistoryItem.save()
  }
}