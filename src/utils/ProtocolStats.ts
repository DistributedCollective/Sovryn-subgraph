import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { ProtocolStats } from '../../generated/schema'

export function createAndReturnProtocolStats(): ProtocolStats {
  let protocolStatsEntity = ProtocolStats.load('0')
  if (protocolStatsEntity == null) {
    protocolStatsEntity = new ProtocolStats('0')
    protocolStatsEntity.totalUsers = BigInt.zero()
    /** TODO: Implement all of these totals */
    protocolStatsEntity.totalMarginTradeVolumeUsd = BigDecimal.zero() // Implemented
    protocolStatsEntity.totalCloseWithSwapVolumeUsd = BigDecimal.zero() // Implemented
    protocolStatsEntity.totalDepositCollateralVolumeUsd = BigDecimal.zero() // Implemented
    protocolStatsEntity.totalLiquidateVolumeUsd = BigDecimal.zero() // Implemented
    protocolStatsEntity.totalAmmVolumeUsd = BigDecimal.zero() // Implemented
    protocolStatsEntity.totalAmmLpFeesUsd = BigDecimal.zero() // Implemented
    protocolStatsEntity.totalAmmStakerFeesUsd = BigDecimal.zero() // Implemented
    protocolStatsEntity.totalTradingFeesUsd = BigDecimal.zero() // Implemented
    protocolStatsEntity.totalLendingFeesUsd = BigDecimal.zero() // Implemented
    protocolStatsEntity.totalBorrowingFeesUsd = BigDecimal.zero() // Implemented
    protocolStatsEntity.totalLendVolumeUsd = BigDecimal.zero() // Implemented
    protocolStatsEntity.totalUnlendVolumeUsd = BigDecimal.zero() // Implemented
    protocolStatsEntity.totalBorrowVolumeUsd = BigDecimal.zero() // Implemented
    protocolStatsEntity.totalCloseWithDepositVolumeUsd = BigDecimal.zero() // Implemented
    protocolStatsEntity.totalVoluntarilyStakedSov = BigInt.zero() // Implemented
    protocolStatsEntity.totalStakedByVestingSov = BigInt.zero() // Implemented
    protocolStatsEntity.tokens = []
    protocolStatsEntity.save()
  }
  return protocolStatsEntity
}
