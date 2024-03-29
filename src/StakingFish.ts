import {
  TokensStaked as TokensStakedEvent,
  TokensWithdrawn as TokensWithdrawnEvent,
  StakingWithdrawn as StakingWithdrawnEvent,
} from '../generated/Staking/Staking'
import { VestingContract, Transaction, VestingHistoryItem } from '../generated/schema'
import { createAndReturnTransaction } from './utils/Transaction'
import { DEFAULT_DECIMALS, decimal } from '@protofire/subgraph-toolkit'
import { Address, BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { VestingHistoryActionItem } from './utils/types'
import { createAndReturnVestingHistoryItem } from './utils/VestingHistoryItem'

export function handleTokensStaked(event: TokensStakedEvent): void {
  const vestingContract = VestingContract.load(event.params.staker.toHexString())
  if (vestingContract != null) {
    const amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
    vestingContract.currentBalance = vestingContract.currentBalance.plus(amount)
    vestingContract.save()
    createVestingTokensStaked(event)
  }
}

/** When tokens are staked by a vesting contract, create a history item for that contract */
function createVestingTokensStaked(event: TokensStakedEvent): void {
  const amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  const totalStaked = decimal.fromBigInt(event.params.totalStaked, DEFAULT_DECIMALS)

  const vestingTokensStakedEntity = new VestingHistoryItem(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  vestingTokensStakedEntity.staker = event.params.staker.toHexString()
  vestingTokensStakedEntity.action = VestingHistoryActionItem.TokensStaked
  vestingTokensStakedEntity.amount = amount
  vestingTokensStakedEntity.lockedUntil = event.params.lockedUntil.toI32()
  vestingTokensStakedEntity.totalStaked = totalStaked
  vestingTokensStakedEntity.timestamp = event.block.timestamp.toI32()
  vestingTokensStakedEntity.emittedBy = event.address
  vestingTokensStakedEntity.transaction = event.transaction.hash.toHex()
  vestingTokensStakedEntity.save()
}

export function handleTokensWithdrawn(event: TokensWithdrawnEvent): void {
  const transaction = createAndReturnTransaction(event)
  const amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  const id = event.transaction.hash.toHex() + event.logIndex.toHex()
  handleStakingOrTokensWithdrawn({
    id: id,
    transaction: transaction,
    stakingContract: event.address,
    staker: event.params.staker,
    receiver: event.params.receiver,
    amount: amount,
    lockedUntil: BigInt.zero(),
    totalStaked: BigDecimal.zero(),
    event: event,
  })
}

/** This is a copy of handleTokensWithdrawn. The event was renamed but params remained the same. */
export function handleStakingWithdrawn(event: StakingWithdrawnEvent): void {
  const transaction = createAndReturnTransaction(event)
  const amount = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
  const id = event.transaction.hash.toHex() + event.logIndex.toHex()
  handleStakingOrTokensWithdrawn({
    id: id,
    transaction: transaction,
    stakingContract: event.address,
    staker: event.params.staker,
    receiver: event.params.receiver,
    amount: amount,
    lockedUntil: BigInt.zero(),
    totalStaked: BigDecimal.zero(),
    event: event,
  })
}

class TokensWithdrawnParams {
  id: string
  transaction: Transaction
  stakingContract: Address
  staker: Address
  receiver: Address
  amount: BigDecimal
  lockedUntil: BigInt
  totalStaked: BigDecimal
  event: ethereum.Event
}

function handleStakingOrTokensWithdrawn(params: TokensWithdrawnParams): void {
  const vesting = VestingContract.load(params.staker.toHexString().toLowerCase())
  if (vesting !== null) {
    createAndReturnVestingHistoryItem({
      staker: vesting.id,
      action: VestingHistoryActionItem.TokensWithdrawn,
      amount: params.amount,
      lockedUntil: params.lockedUntil,
      totalStaked: params.totalStaked,
      event: params.event,
    })
    vesting.currentBalance = vesting.currentBalance.minus(params.amount)
    vesting.save()
  }
}
