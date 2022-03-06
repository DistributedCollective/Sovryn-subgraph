import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { CandleStick } from '../../generated/schema'
import { Token } from '../../generated/schema'

enum Interval {
  MinuteInterval = 60,
  FifteenMintuesInterval = 60 * 15,
  HourInterval = 60 * 60,
  FourHourInterval = 60 * 60 * 4,
  DayInterval = 60 * 60 * 24,
}

class IntervalStr {
  static MinuteInterval: string = 'MinuteInterval'
  static FifteenMintuesInterval: string = 'FifteenMintuesInterval'
  static HourInterval: string = 'HourInterval'
  static FourHourInterval: string = 'FourHourInterval'
  static DayInterval: string = 'DayInterval'
}

export class ICandleSticks {
  tradingPair: string
  blockTimestamp: BigInt
  oldPrice: BigDecimal
  newPrice: BigDecimal
  volume: BigDecimal
  baseToken: string
  quoteToken: string
}

export function updateCandleSticksPrice(
  baseToken: Token,
  quoteToken: Token,
  oldPrice: BigDecimal,
  newPrice: BigDecimal,
  blockTimestamp: BigInt
): void {
  updateCandlestick(
    baseToken,
    quoteToken,
    oldPrice,
    newPrice,
    blockTimestamp,
    Interval.MinuteInterval,
    IntervalStr.MinuteInterval
  )
  updateCandlestick(
    baseToken,
    quoteToken,
    oldPrice,
    newPrice,
    blockTimestamp,
    Interval.FifteenMintuesInterval,
    IntervalStr.FifteenMintuesInterval
  )
  updateCandlestick(
    baseToken,
    quoteToken,
    oldPrice,
    newPrice,
    blockTimestamp,
    Interval.HourInterval,
    IntervalStr.FifteenMintuesInterval
  )
  updateCandlestick(
    baseToken,
    quoteToken,
    oldPrice,
    newPrice,
    blockTimestamp,
    Interval.FourHourInterval,
    IntervalStr.FourHourInterval
  )
  updateCandlestick(
    baseToken,
    quoteToken,
    oldPrice,
    newPrice,
    blockTimestamp,
    Interval.DayInterval,
    IntervalStr.HourInterval
  )
}

function updateCandlestick(
  baseToken: Token,
  quoteToken: Token,
  oldPrice: BigDecimal,
  newPrice: BigDecimal,
  blockTimestamp: BigInt,
  interval: Interval,
  intervalStr: string
): void {
  let candleStickTimestamp = blockTimestamp.toI32() - (blockTimestamp.toI32() % interval)
  const candlestickId = getCandleStickId(baseToken, quoteToken, candleStickTimestamp)
  const candleStickObj = getCandleStick(candlestickId, intervalStr)

  const isNew = candleStickObj.isNew
  const candleStick = candleStickObj.candleStick
  if (isNew) {
    candleStick.periodStartUnix = candleStickTimestamp
    // candleStick.tradingPair = data.tradingPair
    candleStick.open = oldPrice == BigDecimal.zero() ? newPrice : oldPrice
    candleStick.low = oldPrice == BigDecimal.zero() ? newPrice : oldPrice
    candleStick.high = oldPrice == BigDecimal.zero() ? newPrice : oldPrice
    candleStick.txCount = BigInt.zero()
    candleStick.totalVolume = BigDecimal.zero()
    candleStick.baseToken = baseToken.id
    candleStick.quoteToken = quoteToken.id
  }

  if (newPrice.gt(candleStick.high)) {
    candleStick.high = newPrice
  }

  if (newPrice.lt(candleStick.low)) {
    candleStick.low = newPrice
  }

  candleStick.close = newPrice
  candleStick.txCount = candleStick.txCount.plus(BigInt.fromI32(1))
  candleStick.save()
}
class ICandleStick {
  candleStick: CandleStick
  isNew: boolean
}

function getCandleStick(candlestickId: string, interval: string): ICandleStick {
  let candleStick = CandleStick.load(candlestickId)
  let isNew = false
  if (candleStick == null) {
    isNew = true
    candleStick = new CandleStick(candlestickId)
    candleStick.interval = interval
  }

  return {
    candleStick,
    isNew,
  }
}

function getCandleStickId(baseToken: Token, quoteToken: Token, candleStickTimestamp: number): string {
  const tradingPairId = baseToken.id.toLowerCase() + '_' + quoteToken.id.toLowerCase()
  const candleStickId = tradingPairId + '-' + candleStickTimestamp.toString()
  return candleStickId
}
