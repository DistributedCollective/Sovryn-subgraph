import { Stake } from '../../generated/schema'
import { DelegateStakeChanged } from '../../generated/Staking/Staking'
import { decimal, DEFAULT_DECIMALS } from '@protofire/subgraph-toolkit'
import { BigInt } from '@graphprotocol/graph-ts'

export function createOrUpdateStake(event: DelegateStakeChanged): void {
  const stakeId = getStakeId(event.params.delegate.toHexString(), event.params.lockedUntil)
  let stake = Stake.load(stakeId)
  if (stake == null) {
    stake = new Stake(stakeId)
  }
  stake.user = event.params.delegate.toHexString()
  stake.amount = decimal.fromBigInt(event.params.newBalance, DEFAULT_DECIMALS)
  stake.lockedUntil = event.params.lockedUntil.toI32()
  stake.save()
}

function createPartialStake(delegate: string, lockedUntil: BigInt): Stake {
  const id = getStakeId(delegate, lockedUntil)
  return new Stake(id)
}

export function setStakeType(delegate: string, lockedUntil: BigInt, stakeType: string): void {
  let stake = Stake.load(getStakeId(delegate, lockedUntil))
  if (stake == null) {
    stake = createPartialStake(delegate, lockedUntil)
  }
  stake.stakeType = stakeType
  stake.save()
}

function getStakeId(delegate: string, lockedUntil: BigInt): string {
  return delegate + '-' + lockedUntil.toI32().toString()
}
