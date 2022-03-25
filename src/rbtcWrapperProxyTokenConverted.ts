import { TokenConverted as TokenConvertedEvent } from '../generated/rbtcWrapperProxyTokenConverted/rbtcWrapperProxyTokenConverted'
import { Swap } from '../generated/schema'
import { loadTransaction } from './utils/Transaction'

/**
 * This event sometimes includes the user address when a Swap occurs. This is useful for updating the Swap entity with the correct user address
 */
export function handleTokenConverted(event: TokenConvertedEvent): void {
  loadTransaction(event)

  let swapEntity = Swap.load(event.transaction.hash.toHexString())
  if (swapEntity != null) {
    swapEntity.user = event.params._beneficiary.toHexString()
    swapEntity.save()
  }
}
