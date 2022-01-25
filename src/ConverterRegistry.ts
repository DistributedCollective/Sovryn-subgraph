import { log, BigInt } from '@graphprotocol/graph-ts'
import {
  ConverterAnchorAdded as ConverterAnchorAddedEvent,
  ConverterAnchorRemoved as ConverterAnchorRemovedEvent,
  LiquidityPoolAdded as LiquidityPoolAddedEvent,
  LiquidityPoolRemoved as LiquidityPoolRemovedEvent,
  ConvertibleTokenAdded as ConvertibleTokenAddedEvent,
  ConvertibleTokenRemoved as ConvertibleTokenRemovedEvent,
  SmartTokenAdded as SmartTokenAddedEvent,
  SmartTokenRemoved as SmartTokenRemovedEvent,
  OwnerUpdate as OwnerUpdateEvent,
} from '../generated/ConverterRegistry/ConverterRegistry'

import { SmartTokenContract } from '../generated/ConverterRegistry/SmartTokenContract'
import { LiquidityPoolV1Converter as LiquidityPoolV1ConverterContract } from '../generated/ConverterRegistry/LiquidityPoolV1Converter'
import { ERC20Token as ERC20TokenContract } from '../generated/ConverterRegistry/ERC20Token'

import {
  ConverterAnchorAdded,
  ConverterAnchorRemoved,
  LiquidityPoolAdded,
  LiquidityPoolRemoved,
  ConvertibleTokenAdded,
  ConvertibleTokenRemoved,
  SmartTokenAdded,
  SmartTokenRemoved,
  OwnerUpdate,
  Token,
  SmartToken,
  LiquidityPoolV1Converter,
  ConverterRegistry,
  LiquidityPoolToken,
  TokenSmartToken,
} from '../generated/schema'

import {
  SmartToken as SmartTokenTemplate,
  LiquidityPoolV1Converter as LiquidityPoolV1ConverterTemplate,
  ERC20Token as ERC20TokenTemplate,
} from '../generated/templates'

export function handleConverterAnchorAdded(event: ConverterAnchorAddedEvent): void {
  let entity = new ConverterAnchorAdded(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._anchor = event.params._anchor
  entity.save()
}

export function handleConverterAnchorRemoved(event: ConverterAnchorRemovedEvent): void {
  let entity = new ConverterAnchorRemoved(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._anchor = event.params._anchor
  entity.save()
}

export function handleLiquidityPoolAdded(event: LiquidityPoolAddedEvent): void {
  let entity = new LiquidityPoolAdded(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._liquidityPool = event.params._liquidityPool
  entity.save()
}

export function handleLiquidityPoolRemoved(event: LiquidityPoolRemovedEvent): void {
  let entity = new LiquidityPoolRemoved(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._liquidityPool = event.params._liquidityPool
  entity.save()
}

export function handleConvertibleTokenAdded(event: ConvertibleTokenAddedEvent): void {
  let entity = new ConvertibleTokenAdded(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._convertibleToken = event.params._convertibleToken
  entity._smartToken = event.params._smartToken
  entity.save()
}

export function handleConvertibleTokenRemoved(event: ConvertibleTokenRemovedEvent): void {
  let entity = new ConvertibleTokenRemoved(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._convertibleToken = event.params._convertibleToken
  entity._smartToken = event.params._smartToken
  entity.save()
}

export function handleSmartTokenAdded(event: SmartTokenAddedEvent): void {
  let smartTokenAddress = event.params._smartToken
  let smartTokenEntity = SmartToken.load(smartTokenAddress.toHex())

  if (smartTokenEntity == null) {
    smartTokenEntity = new SmartToken(smartTokenAddress.toHex())

    SmartTokenTemplate.create(smartTokenAddress)
    log.debug('Smart Token created: {}', [smartTokenAddress.toHex()])
  }

  let smartTokenContract = SmartTokenContract.bind(smartTokenAddress)

  if (smartTokenEntity.addedToRegistryBlockNumber === null) {
    smartTokenEntity.addedToRegistryBlockNumber = event.block.number
    smartTokenEntity.addedToRegistryTransactionHash = event.transaction.hash
  }

  log.debug('Smart Token added to registry: {}', [smartTokenAddress.toHex()])

  let converterAddress = smartTokenContract.owner()
  log.debug('Converter address: {}', [converterAddress.toHex()])
  let converterEntity = LiquidityPoolV1Converter.load(converterAddress.toHex())

  if (converterEntity == null) {
    LiquidityPoolV1ConverterTemplate.create(converterAddress)
    converterEntity = new LiquidityPoolV1Converter(converterAddress.toHex())
    converterEntity.firstAddedToRegistryBlockNumber = event.block.number
    converterEntity.firstAddedToRegistryBlockTimestamp = event.block.timestamp
  }

  let converterContract = LiquidityPoolV1ConverterContract.bind(converterAddress)

  let converterConnectorTokenCountResult = converterContract.try_connectorTokenCount()

  if (!converterConnectorTokenCountResult.reverted) {
    let numConnectorTokens = converterConnectorTokenCountResult.value
    for (let i = 0; i < numConnectorTokens; i++) {
      let connectorTokenResult = converterContract.try_connectorTokens(BigInt.fromI32(i))
      if (!connectorTokenResult.reverted) {
        let connectorTokenAddress = connectorTokenResult.value

        let connectorTokenEntity = Token.load(connectorTokenAddress.toHex())
        if (connectorTokenEntity == null) {
          connectorTokenEntity = new Token(connectorTokenAddress.toHex())
        }

        let connectorTokenContract = ERC20TokenContract.bind(connectorTokenAddress)

        let connectorTokenNameResult = connectorTokenContract.try_name()
        if (!connectorTokenNameResult.reverted) {
          connectorTokenEntity.name = connectorTokenNameResult.value
        }
        let connectorTokenSymbolResult = connectorTokenContract.try_symbol()
        if (!connectorTokenSymbolResult.reverted) {
          connectorTokenEntity.symbol = connectorTokenSymbolResult.value
        }
        let connectorTokenDecimalsResult = connectorTokenContract.try_decimals()
        if (!connectorTokenDecimalsResult.reverted) {
          connectorTokenEntity.decimals = connectorTokenDecimalsResult.value
        }

        let liquidityPoolTokenEntity = LiquidityPoolToken.load(converterAddress.toHex() + connectorTokenAddress.toHex())
        if (liquidityPoolTokenEntity === null) {
          liquidityPoolTokenEntity = new LiquidityPoolToken(converterAddress.toHex() + connectorTokenAddress.toHex())
        }

        liquidityPoolTokenEntity.token = connectorTokenAddress.toHex()
        liquidityPoolTokenEntity.liquidityPool = converterAddress.toHex()
        liquidityPoolTokenEntity.save()

        let tokenSmartTokenEntity = TokenSmartToken.load(connectorTokenAddress.toHex() + smartTokenAddress.toHex())
        if (tokenSmartTokenEntity === null) {
          tokenSmartTokenEntity = new TokenSmartToken(connectorTokenAddress.toHex() + smartTokenAddress.toHex())
        }

        tokenSmartTokenEntity.token = connectorTokenAddress.toHex()
        tokenSmartTokenEntity.smartToken = smartTokenAddress.toHex()
        tokenSmartTokenEntity.save()
        // log.debug('Connector Token Converters: {}', [connectorTokenConverters.toString()])
        // connectorTokenEntity.liquidityPools = connectorTokenConverters
        connectorTokenEntity.currentConverterRegistry = event.address.toHex()
        connectorTokenEntity.save()
      }
    }
    if (converterConnectorTokenCountResult.value == 2) {
      smartTokenEntity.smartTokenType = 'Relay'
    } else {
      smartTokenEntity.smartTokenType = 'Liquid'
    }
  }

  let smartTokenNameResult = smartTokenContract.try_name()
  if (!smartTokenNameResult.reverted) {
    smartTokenEntity.name = smartTokenNameResult.value
  }
  let smartTokenSymbolResult = smartTokenContract.try_symbol()
  if (!smartTokenSymbolResult.reverted) {
    smartTokenEntity.symbol = smartTokenSymbolResult.value
  }
  let smartTokenDecimalsResult = smartTokenContract.try_decimals()
  if (!smartTokenDecimalsResult.reverted) {
    smartTokenEntity.decimals = smartTokenDecimalsResult.value
  }

  smartTokenEntity.currentConverterRegistry = event.address.toHex()

  // let smartTokenVersionResult = smartTokenContract.try_version()
  // if (!smartTokenVersionResult.reverted) {
  //   smartTokenEntity.version = smartTokenVersionResult.value
  // }
  // let smartTokenTransfersEnabledResult = smartTokenContract.try_transfersEnabled()
  // if (!smartTokenTransfersEnabledResult.reverted) {
  //   smartTokenEntity.transfersEnabled = smartTokenTransfersEnabledResult.value
  // }
  converterEntity.smartToken = smartTokenAddress.toHex()
  converterEntity.currentConverterRegistry = event.address.toHex()
  let converterContractRegistryResult = converterContract.try_registry()
  if (!converterContractRegistryResult.reverted) {
    converterEntity.currentContractRegistry = converterContractRegistryResult.value.toHex()
  }
  // let converterVersionResult = converterContract.try_version()
  // if (!converterVersionResult.reverted) {
  //   converterEntity.version = converterVersionResult.value
  // }
  let converterOwnerResult = converterContract.try_owner()
  if (!converterOwnerResult.reverted) {
    converterEntity.owner = converterOwnerResult.value.toHex()
  }
  let converterMaxConversionFeeResult = converterContract.try_maxConversionFee()
  if (!converterMaxConversionFeeResult.reverted) {
    converterEntity.maxConversionFee = converterMaxConversionFeeResult.value
  }
  let converterTypeResult = converterContract.try_converterType()
  if (!converterTypeResult.reverted) {
    converterEntity.type = converterTypeResult.value
  }

  let converterRegistryEntity = ConverterRegistry.load(event.address.toHex())
  if (converterRegistryEntity == null) {
    converterRegistryEntity = new ConverterRegistry(event.address.toHex())
    converterRegistryEntity.numConverters = BigInt.zero()
  }
  converterRegistryEntity.lastUsedAtBlockTimestamp = event.block.timestamp
  converterRegistryEntity.lastUsedAtTransactionHash = event.transaction.hash.toHex()
  converterRegistryEntity.lastUsedAtBlockNumber = event.block.number
  converterRegistryEntity.numConverters = converterRegistryEntity.numConverters.plus(BigInt.fromI32(1))
  // let converterRegistryConverters = converterRegistryEntity.converters || []
  // if (converterRegistryConverters.length == 0) {
  //   converterRegistryConverters.push(converterAddress.toHex())
  // } else if (!converterRegistryConverters.includes(converterAddress.toHex())) {
  //   converterRegistryConverters.push(converterAddress.toHex())
  // }
  // log.debug('Converter Registry Converters: {}', [converterRegistryConverters.toString()])
  // converterRegistryEntity.converters = converterRegistryConverters
  // let converterRegistrySmartTokens = converterRegistryEntity.smartTokens || []
  // if (converterRegistrySmartTokens.length == 0) {
  //   converterRegistrySmartTokens.push(smartTokenAddress.toHex())
  // } else if (!converterRegistrySmartTokens.includes(smartTokenAddress.toHex())) {
  //   converterRegistrySmartTokens.push(smartTokenAddress.toHex())
  // }
  // log.debug('Converter Registry Smart Tokens: {}', [converterRegistrySmartTokens.toString()])
  // converterRegistryEntity.smartTokens = converterRegistrySmartTokens
  // let converterRegistryConnectorTokens = converterRegistryEntity.connectorTokens || []
  // for (var i = 0; i < converterConnectorTokens.length; i++) {
  //   if (!converterRegistryConnectorTokens.includes(converterConnectorTokens[i])) {
  //     converterRegistryConnectorTokens.push(converterConnectorTokens[i])
  //   }
  // }
  // log.debug('Converter Registry Connector Tokens: {}', [converterRegistryConnectorTokens.toString()])
  // converterRegistryEntity.connectorTokens = converterRegistryConnectorTokens
  smartTokenEntity.owner = converterAddress

  converterRegistryEntity.save()
  smartTokenEntity.save()
  converterEntity.save()
  // let converterManagerResult = converterContract.try_manager()
  // if (!converterManagerResult.reverted) {
  //   converterEntity.manager = converterManagerResult.value.toHex()
  // }

  // smartTokenEntity.save()

  let entity = new SmartTokenAdded(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._smartToken = event.params._smartToken
  entity.save()
}

export function handleSmartTokenRemoved(event: SmartTokenRemovedEvent): void {
  let entity = new SmartTokenRemoved(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._smartToken = event.params._smartToken
  entity.save()
}

export function handleOwnerUpdate(event: OwnerUpdateEvent): void {
  let entity = new OwnerUpdate(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._prevOwner = event.params._prevOwner
  entity._newOwner = event.params._newOwner
  entity.save()
}
