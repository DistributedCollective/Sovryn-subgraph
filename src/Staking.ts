import {
  DelegateChanged as DelegateChangedEvent,
  ExtendedStakingDuration as ExtendedStakingDurationEvent,
  TokensStaked as TokensStakedEvent,
  TokensWithdrawn as TokensWithdrawnEvent,
  StakingWithdrawn as StakingWithdrawnEvent,
  DelegateStakeChanged as DelegateStakeChangedEvent,
} from '../generated/Staking/Staking'
import { VestingContract, User, Transaction, FeeSharingTokensTransferred } from '../generated/schema'
import { createAndReturnTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'
import { DEFAULT_DECIMALS, ZERO_ADDRESS, decimal } from '@protofire/subgraph-toolkit'
import { Address, BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { genesisVestingStartBlock, genesisVestingEndBlock } from './blockNumbers/blockNumbers'
import {
  decrementCurrentStakedByVestingSov,
  decrementCurrentVoluntarilyStakedSov,
  incrementCurrentStakedByVestingSov,
  incrementCurrentVoluntarilyStakedSov,
} from './utils/ProtocolStats'
import { adminContracts } from './contracts/contracts'
import { StakeHistoryAction, StakeType, VestingHistoryActionItem, VestingContractType } from './utils/types'
import { createOrUpdateStake, setStakeType } from './utils/Stake'
import { createAndReturnVestingContract, decrementVestingContractBalance, incrementVestingContractBalance } from './utils/VestingContract'
import { decrementUserStakeHistory, incrementUserStakeHistory } from './utils/UserStakeHistory'
import { createAndReturnStakeHistoryItem } from './utils/StakeHistoryItem'
import { createAndReturnVestingHistoryItem } from './utils/VestingHistoryItem'

export function handleDelegateChanged(event: DelegateChangedEvent): void {
  createAndReturnTransaction(event)
  const delegator = event.params.delegator.toHexString()
  const fromDelegate = event.params.fromDelegate.toHexString()
  const toDelegate = event.params.toDelegate.toHexString()
  const isUserDelegated =
    fromDelegate != ZERO_ADDRESS && toDelegate != ZERO_ADDRESS && fromDelegate != toDelegate && delegator == event.transaction.from.toHexString()
  if (isUserDelegated) {
    createAndReturnUser(event.params.toDelegate, event.block.timestamp)
    createAndReturnStakeHistoryItem({
      event,
      user: delegator,
      action: StakeHistoryAction.Delegate,
      amount: BigDecimal.zero(),
      token: ZERO_ADDRESS,
      lockedUntil: event.params.lockedUntil,
    })
    setStakeType(delegator, toDelegate, event.params.lockedUntil, StakeType.Delegated)
  }
}

export function handleDelegateStakeChanged(event: DelegateStakeChangedEvent): void {
  createAndReturnUser(event.params.delegate, event.block.timestamp)
  createOrUpdateStake(event)
}

export function handleExtendedStakingDuration(event: ExtendedStakingDurationEvent): void {
  const staker = event.params.staker.toHexString()
  createAndReturnTransaction(event)
  createAndReturnStakeHistoryItem({
    event,
    user: staker,
    action: StakeHistoryAction.ExtendStake,
    amount: BigDecimal.zero(),
    token: ZERO_ADDRESS,
    lockedUntil: event.params.newDate,
  })
  setStakeType(staker, staker, event.params.newDate, StakeType.UserStaked)
}

export function handleTokensStaked(event: TokensStakedEvent): void {
  createAndReturnTransaction(event)
  const amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  const totalStaked = decimal.fromBigInt(event.params.totalStaked, DEFAULT_DECIMALS)
  let vestingContract = VestingContract.load(event.params.staker.toHexString())
  /** Gensis Vesting contracts did not emit a VestingCreated event. Therefore, they need to be created from here. **/
  const isGenesisContract =
    vestingContract == null &&
    event.block.number <= genesisVestingEndBlock &&
    event.block.number >= genesisVestingStartBlock &&
    event.transaction.from.toHexString() != event.params.staker.toHexString()

  if (isGenesisContract) {
    vestingContract = createAndReturnVestingContract({
      vestingAddress: event.params.staker.toHexString(),
      user: event.transaction.from.toHexString(),
      cliff: BigInt.zero(),
      duration: BigInt.zero(),
      balance: amount,
      type: VestingContractType.Genesis,
      event: event,
    })
  }

  if (vestingContract != null) {
    createAndReturnVestingHistoryItem({
      staker: event.params.staker.toHexString(),
      action: VestingHistoryActionItem.TokensStaked,
      amount: amount,
      lockedUntil: event.params.lockedUntil,
      totalStaked: totalStaked,
      event,
    })
    incrementCurrentStakedByVestingSov(amount)
    if (!isGenesisContract) {
      incrementVestingContractBalance(vestingContract, amount)
    }
    setStakeType(vestingContract.user, vestingContract.user, event.params.lockedUntil, StakeType.VestingStaked)
  } else {
    const staker = event.params.staker.toHexString()
    createAndReturnUser(event.params.staker, event.block.timestamp)
    createAndReturnStakeHistoryItem({
      event,
      user: staker,
      action: event.params.amount < event.params.totalStaked ? StakeHistoryAction.IncreaseStake : StakeHistoryAction.Stake,
      amount: amount,
      token: ZERO_ADDRESS,
      lockedUntil: event.params.lockedUntil,
    })
    incrementUserStakeHistory(event.params.staker, amount)
    incrementCurrentVoluntarilyStakedSov(amount)
    setStakeType(staker, staker, event.params.lockedUntil, StakeType.UserStaked)
  }
}

export function handleTokensWithdrawn(event: TokensWithdrawnEvent): void {
  const transaction = createAndReturnTransaction(event)
  const amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  handleStakingOrTokensWithdrawn(
    {
      transaction: transaction,
      stakingContract: event.address,
      staker: event.params.staker,
      receiver: event.params.receiver,
      amount: amount,
    },
    event,
  )
}

/** This is a copy of handleTokensWithdrawn. The event was renamed but params remained the same. */
export function handleStakingWithdrawn(event: StakingWithdrawnEvent): void {
  const transaction = createAndReturnTransaction(event)
  const amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  handleStakingOrTokensWithdrawn(
    {
      transaction: transaction,
      stakingContract: event.address,
      staker: event.params.staker,
      receiver: event.params.receiver,
      amount: amount,
    },
    event,
  )
}

class TokensWithdrawnParams {
  transaction: Transaction
  stakingContract: Address
  staker: Address
  receiver: Address
  amount: BigDecimal
}

function handleStakingOrTokensWithdrawn(params: TokensWithdrawnParams, event: ethereum.Event): void {
  const user = User.load(params.staker.toHexString().toLowerCase())
  const vesting = VestingContract.load(params.staker.toHexString())
  if (user != null) {
    const slashingEvent = FeeSharingTokensTransferred.load(params.transaction.id)
    const slashedAmount = slashingEvent == null ? BigDecimal.zero() : slashingEvent.amount
    createAndReturnStakeHistoryItem({
      event,
      user: params.receiver.toHexString(),
      action: slashingEvent == null ? StakeHistoryAction.WithdrawStaked : StakeHistoryAction.Unstake,
      amount: params.amount,
      token: ZERO_ADDRESS,
      lockedUntil: BigInt.zero(),
    })
    decrementUserStakeHistory(params.receiver, params.amount, slashedAmount)
    decrementCurrentVoluntarilyStakedSov(params.amount.plus(slashedAmount))
  } else if (vesting != null) {
    const isRevoked = adminContracts.includes(params.receiver.toHexString().toLowerCase()) && vesting.type == VestingContractType.Team
    createAndReturnVestingHistoryItem({
      staker: params.staker.toHexString(),
      action: isRevoked ? VestingHistoryActionItem.TeamTokensRevoked : VestingHistoryActionItem.TokensWithdrawn,
      amount: params.amount,
      lockedUntil: BigInt.zero(),
      totalStaked: BigDecimal.zero(),
      event,
    })
    decrementVestingContractBalance(params.staker.toHexString(), params.amount)
    decrementCurrentStakedByVestingSov(params.amount)
  }
}
