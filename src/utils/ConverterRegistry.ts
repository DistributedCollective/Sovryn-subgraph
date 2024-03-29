import { ConverterRegistry } from '../../generated/schema'
import { Address } from '@graphprotocol/graph-ts'

export function createAndReturnConverterRegistry(address: Address): ConverterRegistry {
  let converterRegistryEntity = ConverterRegistry.load(address.toHex())
  if (converterRegistryEntity == null) {
    converterRegistryEntity = new ConverterRegistry(address.toHex())
    converterRegistryEntity.numConverters = 0
    converterRegistryEntity.save()
  }
  return converterRegistryEntity
}
