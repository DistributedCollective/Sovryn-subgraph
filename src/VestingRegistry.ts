import {
  AdminAdded as AdminAddedEvent,
  AdminRemoved as AdminRemovedEvent,
  CSOVReImburse as CSOVReImburseEvent,
  CSOVTokensExchanged as CSOVTokensExchangedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  SOVTransferred as SOVTransferredEvent,
  TeamVestingCreated as TeamVestingCreatedEvent,
  VestingCreated as VestingCreatedEvent,
  TokensStaked as TokensStakedEvent,
} from '../generated/VestingRegistry1/VestingRegistry'
import { VestingCreated as VestingCreatedProxyEvent, TeamVestingCreated as TeamVestingCreatedProxyEvent } from '../generated/VestingRegistryProxy/VestingProxy'
import { VestingContract } from '../generated/schema'
import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { createAndReturnTransaction } from './utils/Transaction'
import { vestingRegistry1, vestingRegistry2, vestingRegistry3, vestingRegistryFish } from './contracts/contracts'
import { createAndReturnUser } from './utils/User'
import { VestingContractType } from './utils/types'
import { DEFAULT_DECIMALS, decimal } from '@protofire/subgraph-toolkit'

export function handleAdminAdded(event: AdminAddedEvent): void {}

export function handleAdminRemoved(event: AdminRemovedEvent): void {}

export function handleCSOVReImburse(event: CSOVReImburseEvent): void {}

export function handleCSOVTokensExchanged(event: CSOVTokensExchangedEvent): void {
  /**
   * Genesis vesting contract creation did not trigger a VestingCreated event.
   * However, it did trigger this event.
   */
}

export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {}

export function handleSOVTransferred(event: SOVTransferredEvent): void {}

export function handleTeamVestingCreated(event: TeamVestingCreatedEvent): void {
  /** Some contracts are created twice. So, we need to first check if the contract already exists */
  let existingContract = VestingContract.load(event.params.vesting.toHexString())
  if (existingContract == null) {
    let entity = new VestingContract(event.params.vesting.toHexString())
    let user = createAndReturnUser(event.params.tokenOwner, event.block.timestamp)
    entity.user = user.id
    entity.cliff = event.params.cliff.toI32()
    entity.duration = event.params.duration.toI32()
    entity.startingBalance = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
    entity.currentBalance = BigDecimal.zero()
    let transaction = createAndReturnTransaction(event)
    entity.createdAtTransaction = transaction.id
    entity.createdAtTimestamp = transaction.timestamp
    entity.emittedBy = event.address
    entity.type = event.address.toHexString() === vestingRegistryFish ? VestingContractType.FishTeam : VestingContractType.Team
    entity.save()
  }
}

/** This event has a different event signature than TeamVestingCreated, but for our purposes the logic is the same.
 * TODO: Dry up this code
 */
export function handleTeamVestingCreatedProxy(event: TeamVestingCreatedProxyEvent): void {
  let existingContract = VestingContract.load(event.params.vesting.toHexString())
  if (existingContract == null) {
    let entity = new VestingContract(event.params.vesting.toHexString())
    let user = createAndReturnUser(event.params.tokenOwner, event.block.timestamp)
    entity.user = user.id
    entity.cliff = event.params.cliff.toI32()
    entity.duration = event.params.duration.toI32()
    entity.startingBalance = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
    entity.currentBalance = BigDecimal.zero()
    let transaction = createAndReturnTransaction(event)
    entity.createdAtTransaction = transaction.id
    entity.createdAtTimestamp = transaction.timestamp
    entity.emittedBy = event.address
    entity.type = VestingContractType.Team
    entity.save()
  }
}

export function handleTokensStaked(event: TokensStakedEvent): void {}

export function handleVestingCreated(event: VestingCreatedEvent): void {
  let existingContract = VestingContract.load(event.params.vesting.toHexString())
  if (existingContract == null) {
    let entity = new VestingContract(event.params.vesting.toHexString())
    let user = createAndReturnUser(event.params.tokenOwner, event.block.timestamp)
    entity.user = user.id
    entity.cliff = event.params.cliff.toI32()
    entity.duration = event.params.duration.toI32()
    entity.startingBalance = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
    entity.currentBalance = BigDecimal.zero()
    let transaction = createAndReturnTransaction(event)
    entity.createdAtTransaction = transaction.id
    entity.createdAtTimestamp = transaction.timestamp
    entity.emittedBy = event.address
    entity.type = getVestingContractType(event.address.toHexString(), event.params.cliff, event.params.duration, event.block.timestamp)
    entity.save()
  }
}

export function handleVestingCreatedProxy(event: VestingCreatedProxyEvent): void {
  let existingContract = VestingContract.load(event.params.vesting.toHexString())
  if (existingContract == null) {
    let entity = new VestingContract(event.params.vesting.toHexString())
    let user = createAndReturnUser(event.params.tokenOwner, event.block.timestamp)
    entity.user = user.id
    entity.cliff = event.params.cliff.toI32()
    entity.duration = event.params.duration.toI32()
    entity.startingBalance = decimal.fromBigInt(event.params.amount, DEFAULT_DECIMALS)
    entity.currentBalance = BigDecimal.zero()
    let transaction = createAndReturnTransaction(event)
    entity.createdAtTransaction = transaction.id
    entity.createdAtTimestamp = transaction.timestamp
    entity.emittedBy = event.address
    entity.type = VestingContractType.Rewards
    entity.save()
  }
}

function getVestingContractType(address: string, cliff: BigInt, duration: BigInt, timestamp: BigInt): string {
  /** To determine if a vesting contract from vesting registries 1 and 2 is from Origins or from a Strategic investment round, check if the cliff is equal to the duration
   * We could maybe also check the timestamp as added redundancy, but this adds testnet/mainnet complexity that I want to avoid
   */
  const originsOrStrategic = (cliff: BigInt, duration: BigInt): string => {
    if (cliff == duration) {
      return VestingContractType.Origins
    } else {
      return VestingContractType.Strategic
    }
  }

  if (address == vestingRegistry3.toLowerCase()) return VestingContractType.Rewards
  if (address == vestingRegistryFish.toLowerCase()) return VestingContractType.Fish
  if (address == vestingRegistry1.toLowerCase() || address == vestingRegistry2.toLowerCase()) return originsOrStrategic(cliff, duration)

  /** Rewards is the default type. We could consider having type Undefined or Other */
  return VestingContractType.Rewards
}
