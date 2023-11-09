import { SwapSettings } from '../generated/schema'
import { ProtocolFeeUpdate } from '../generated/SwapSettings/SwapSettings'
import { dataSource } from '@graphprotocol/graph-ts'

export function handleProtocolFeeUpdate(event: ProtocolFeeUpdate): void {
  let settings = SwapSettings.load(dataSource.address().toHexString())
  if (settings == null) {
    settings = new SwapSettings(dataSource.address().toHexString())
  }

  settings.protocolFee = event.params._newProtocolFee.toI32()
  settings.timestamp = event.block.timestamp.toI32()
  settings.save()
}
