import { Address, log } from '@graphprotocol/graph-ts'
import { LiquidityPool } from '../../generated/schema'
import { LiquidityPoolV1Converter as LiquidityPoolV1ConverterContract } from '../../generated/templates/LiquidityPoolV1Converter/LiquidityPoolV1Converter'
import { LiquidityPoolV2Converter as LiquidityPoolV2ConverterContract } from '../../generated/templates/LiquidityPoolV2Converter/LiquidityPoolV2Converter'
// import { SmartToken as SmartTokenContract } from '../../generated/templates/SmartToken/SmartToken'
import {
  LiquidityPoolV1Converter as LiquidityPoolV1ConverterTemplate,
  LiquidityPoolV2Converter as LiquidityPoolV2ConverterTemplate,
} from '../../generated/templates'
// import { SmartToken as SmartTokenTemplate } from '../../generated/templates'

export class IGetLiquidityPool {
  liquidityPool: LiquidityPool
  isNew: boolean
}

export function createAndReturnLiquidityPool(converterAddress: Address, type: number): IGetLiquidityPool {
  let isNew = false
  let liquidityPool = LiquidityPool.load(converterAddress.toHex())
  if (liquidityPool == null) {
    liquidityPool = new LiquidityPool(converterAddress.toHex())
    liquidityPool.activated = false
    if (type == 1) {
      LiquidityPoolV1ConverterTemplate.create(converterAddress)
      liquidityPool.type = 1
      let converterContract = LiquidityPoolV1ConverterContract.bind(converterAddress)
      let converterOwnerResult = converterContract.try_owner()
      if (!converterOwnerResult.reverted) {
        liquidityPool.owner = converterOwnerResult.value.toHex()
      }
      let converterMaxConversionFeeResult = converterContract.try_maxConversionFee()
      if (!converterMaxConversionFeeResult.reverted) {
        liquidityPool.maxConversionFee = converterMaxConversionFeeResult.value
      }
    } else if ((type = 2)) {
      LiquidityPoolV2ConverterTemplate.create(converterAddress)
      liquidityPool.type = 2
      let converterContract = LiquidityPoolV2ConverterContract.bind(converterAddress)
      let converterOwnerResult = converterContract.try_owner()
      if (!converterOwnerResult.reverted) {
        liquidityPool.owner = converterOwnerResult.value.toHex()
      }
      let converterMaxConversionFeeResult = converterContract.try_maxConversionFee()
      if (!converterMaxConversionFeeResult.reverted) {
        liquidityPool.maxConversionFee = converterMaxConversionFeeResult.value
      }
    }
    liquidityPool.save()
    isNew = true
  }
  return { liquidityPool, isNew }
}