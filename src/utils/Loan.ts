/**
 * This file is a work in progress - the goal is to have all PnL calculations and ot
 */

import { BigDecimal, BigInt, Bytes, log } from '@graphprotocol/graph-ts'
import { Loan } from '../../generated/schema'
import { integer, decimal, DEFAULT_DECIMALS } from '@protofire/subgraph-toolkit'
export class LoanStartState {
  loanId: Bytes
  user: Bytes
  type: string
  startTimestamp: BigInt
  loanToken: Bytes
  collateralToken: Bytes
  /** For Borrow, this is newPrincipal. For Trade this is borrowedAmount */
  borrowedAmount: BigDecimal
  /** For Borrow, this is newCollateral. For Trade, this is positionSize */
  positionSize: BigDecimal
  startRate: BigDecimal
}
export class ChangeLoanState {
  loanId: string
  positionSizeChange: BigDecimal
  borrowedAmountChange: BigDecimal
  isOpen: boolean
  type: string | null // Buy or Sell
  rate: BigDecimal
}

/** This is currently very buggy. Convert everything to BigDecimal normal numbers to help with debugging? */
export function createAndReturnLoan(startParams: LoanStartState): Loan {
  let loanEntity = Loan.load(startParams.loanId.toHexString())
  if (loanEntity == null) {
    loanEntity = new Loan(startParams.loanId.toHexString())
    loanEntity.type = startParams.type
    loanEntity.isOpen = true
    loanEntity.startTimestamp = startParams.startTimestamp
    loanEntity.user = startParams.user.toHexString()
    loanEntity.collateralToken = startParams.collateralToken.toHexString()
    loanEntity.loanToken = startParams.loanToken.toHexString()
    loanEntity.borrowedAmount = startParams.borrowedAmount
    loanEntity.startBorrowedAmount = startParams.borrowedAmount
    loanEntity.maxBorrowedAmount = startParams.borrowedAmount
    loanEntity.positionSize = startParams.positionSize
    loanEntity.startPositionSize = startParams.positionSize
    loanEntity.maximumPositionSize = startParams.positionSize
    loanEntity.totalBought = startParams.positionSize
    loanEntity.totalSold = BigDecimal.zero()
    loanEntity.averageBuyPrice = startParams.startRate
    loanEntity.averageSellPrice = BigDecimal.zero()
    loanEntity.realizedPnL = BigDecimal.zero()
    loanEntity.realizedPnLPercent = BigDecimal.zero()
    loanEntity.save()
  }
  return loanEntity
}

export function updateLoanReturnPnL(params: ChangeLoanState): BigDecimal {
  let loanEntity = Loan.load(params.loanId)
  let eventPnL = BigDecimal.zero()
  if (loanEntity != null) {
    loanEntity.positionSize = loanEntity.positionSize.plus(params.positionSizeChange)
    loanEntity.borrowedAmount = loanEntity.borrowedAmount.plus(params.borrowedAmountChange)
    loanEntity.isOpen = params.isOpen
    if (loanEntity.positionSize.gt(loanEntity.maximumPositionSize)) {
      loanEntity.maximumPositionSize = loanEntity.positionSize
    }
    if (loanEntity.borrowedAmount.gt(loanEntity.maxBorrowedAmount)) {
      loanEntity.maxBorrowedAmount = loanEntity.borrowedAmount
    }

    if (params.type == 'Buy') {
      let oldWeightedPrice = loanEntity.totalBought.times(loanEntity.averageBuyPrice)
      let newWeightedPrice = params.positionSizeChange.times(params.rate)
      const newTotalBought = loanEntity.totalBought.plus(params.positionSizeChange)
      loanEntity.totalBought = newTotalBought
      loanEntity.averageBuyPrice = oldWeightedPrice.plus(newWeightedPrice).div(newTotalBought)
    } else if (params.type == 'Sell') {
      const amountSold = BigDecimal.zero().minus(params.positionSizeChange)
      const priceSoldAt = params.rate
      const differenceFromBuyPrice = loanEntity.averageBuyPrice.minus(priceSoldAt)

      // log.debug('DEBUGGING PNL: \nSELL RATE: {} \nLOAN ID: {} \nAMOUNT SOLD: {} \nDIFFERENCE FROM BUY PRICE: {} \nNEW PNL: {}', [
      //   params.rate.toString(),
      //   params.loanId.toString(),
      //   amountSold.toString(),
      //   differenceFromBuyPrice.toString(),
      //   newPnL.toString(),
      // ])

      let oldWeightedPrice = loanEntity.totalSold.times(loanEntity.averageSellPrice) // If first time, this is 0
      let newWeightedPrice = amountSold.times(params.rate)
      const newTotalSold = loanEntity.totalSold.plus(amountSold)
      loanEntity.totalSold = newTotalSold
      const totalWeightedPrice = oldWeightedPrice.plus(newWeightedPrice)
      loanEntity.averageSellPrice = totalWeightedPrice.div(newTotalSold)
      const newPnL = differenceFromBuyPrice.gt(BigDecimal.zero()) ? amountSold.div(loanEntity.averageSellPrice.div(differenceFromBuyPrice)) : BigDecimal.zero()
      eventPnL = newPnL
      loanEntity.realizedPnL = loanEntity.realizedPnL.plus(newPnL).truncate(18)
      loanEntity.realizedPnLPercent = loanEntity.realizedPnL.times(decimal.fromNumber(100)).div(loanEntity.maximumPositionSize).truncate(8)
    } else if (params.type == null) {
      /**
       * TODO: How does DepositCollateral affect PnL?
       */
    }
    loanEntity.save()
  }
  return eventPnL
}
