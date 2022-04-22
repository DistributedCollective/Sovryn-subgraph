import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { User, UserStakeHistory } from '../../generated/schema'
import { createAndReturnProtocolStats } from './ProtocolStats'

export function createAndReturnUser(address: Address): User {
  let userEntity = User.load(address.toHex())

  if (userEntity == null) {
    userEntity = new User(address.toHex())
    let protocolStats = createAndReturnProtocolStats()
    protocolStats.totalUsers = protocolStats.totalUsers.plus(BigInt.fromI32(1))
    protocolStats.save()
  }

  userEntity.save()
  return userEntity
}

export function createAndReturnUserStakeHistory(address: Address): UserStakeHistory {
  let historyEntity = UserStakeHistory.load(address.toHex())
  if (historyEntity == null) {
    historyEntity = new UserStakeHistory(address.toHex())
    historyEntity.user = address.toHex()
    historyEntity.totalStaked = BigDecimal.zero()
    historyEntity.totalWithdrawn = BigDecimal.zero()
    historyEntity.totalRemaining = BigDecimal.zero()
    historyEntity.save()
  }
  return historyEntity
}
