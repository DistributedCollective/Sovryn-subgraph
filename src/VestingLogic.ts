import {
  DividendsCollected as DividendsCollectedEvent,
  MigratedToNewStakingContract as MigratedToNewStakingContractEvent,
  TokensStaked as TokensStakedEvent,
  TokensWithdrawn as TokensWithdrawnEvent,
  VotesDelegated as VotesDelegatedEvent,
} from '../generated/templates/VestingLogic/VestingLogic'
import { DividendsCollected, TokensWithdrawn } from '../generated/schema'

import { loadTransaction } from './utils/Transaction'

export function handleDividendsCollected(event: DividendsCollectedEvent): void {
  let entity = new DividendsCollected(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.caller = event.params.caller
  entity.loanPoolToken = event.params.loanPoolToken
  entity.receiver = event.params.receiver.toHexString()
  entity.maxCheckpoints = event.params.maxCheckpoints
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleMigratedToNewStakingContract(event: MigratedToNewStakingContractEvent): void {}

export function handleTokensStaked(event: TokensStakedEvent): void {}

export function handleTokensWithdrawn(event: TokensWithdrawnEvent): void {
  let entity = new TokensWithdrawn(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.caller = event.params.caller
  entity.receiver = event.params.receiver
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleVotesDelegated(event: VotesDelegatedEvent): void {}