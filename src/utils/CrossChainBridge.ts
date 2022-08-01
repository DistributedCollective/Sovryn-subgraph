import { BigInt, Address, ethereum, crypto, ByteArray, log } from '@graphprotocol/graph-ts'
import { decimal, ZERO_ADDRESS } from '@protofire/subgraph-toolkit'
import { Federation, Bridge, CrossTransfer, Token, SideToken, Transaction } from '../../generated/schema'
import { createAndReturnTransaction } from './Transaction'
import { NewSideToken as NewSideTokenEvent } from '../../generated/Bridge/Bridge'
import { BridgeType } from './types'
import { createAndReturnUser } from './User'

export class CrossTransferEvent {
  id: string = ''
  receiver: Address
  originalTokenAddress: Address
  amount: BigInt
  // symbol?: string
  decimals: i32
  granularity: BigInt
  // userData: Bytes
  status: string
  direction: string
  timestamp: BigInt
  transaction: Transaction
}

export const getCrossTransferId = (crossTransferEvent: CrossTransferEvent): ByteArray => {
  const id = crypto.keccak256(
    ByteArray.fromUTF8(
      crossTransferEvent.originalTokenAddress.toHex() +
        '-' +
        crossTransferEvent.receiver.toHex() +
        '-' +
        crossTransferEvent.amount.toHex() +
        '-' +
        // symbol +
        // '-' +
        crossTransferEvent.decimals.toString() +
        '-' +
        crossTransferEvent.granularity.toHex(),
      // '-' +
      // crossTransferEvent.userData.toHex(),
    ),
  )
  return id
}

export const createAndReturnBridge = (bridgeAddress: Address, event: ethereum.Event): Bridge => {
  let bridge = Bridge.load(bridgeAddress.toHex())
  if (bridge == null) {
    bridge = new Bridge(bridgeAddress.toHex())
    if (isETHBridge(bridgeAddress.toHex())) {
      bridge.type = BridgeType.RSK_ETH
    } else if (isBSCBridge(bridgeAddress.toHex())) {
      bridge.type = BridgeType.RSK_BSC
    } else {
      log.warning('Unknown bridge type for bridgeAddress: {}', [bridgeAddress.toHex()])
    }
    bridge.isUpgrading = false
    bridge.isPaused = false
    bridge.totalFundsReceived = BigInt.zero()
    bridge.totalFundsReceived = BigInt.zero()
    bridge.feesCollected = BigInt.zero()
    bridge.federation = ZERO_ADDRESS
    const tx = createAndReturnTransaction(event)
    bridge.createdAtTx = tx.id
    bridge.save()
  }
  return bridge
}

export const createAndReturnFederation = (federationAddress: Address, event: ethereum.Event): Federation => {
  let federation = Federation.load(federationAddress.toHex())
  if (federation == null) {
    federation = new Federation(federationAddress.toHex())
    federation.totalExecuted = 0
    federation.totalVotes = 0
    federation.isActive = true
    const tx = createAndReturnTransaction(event)
    federation.createdAtTx = tx.id
    federation.save()
  }
  return federation
}

export const createAndReturnCrossTransfer = (crossTransferEvent: CrossTransferEvent): CrossTransfer => {
  const id = crossTransferEvent.id != '' ? crossTransferEvent.id : getCrossTransferId(crossTransferEvent).toHex()
  let crossTransfer = CrossTransfer.load(id)
  if (crossTransfer == null) {
    crossTransfer = new CrossTransfer(id)
    crossTransfer.direction = crossTransferEvent.direction.toString()
    crossTransfer.votes = 0
    crossTransfer.status = crossTransferEvent.status.toString()
    const user = createAndReturnUser(crossTransferEvent.receiver, crossTransferEvent.timestamp)
    crossTransfer.receiver = user.id
    crossTransfer.originalTokenAddress = crossTransferEvent.originalTokenAddress
    // TODO: get side token
    // const token = Token.load(crossTransferEvent.tokenAddress.toHex())
    crossTransfer.token = crossTransferEvent.originalTokenAddress.toHex()
    // const sideToken = SideToken.load(crossTransferEvent.tokenAddress.toHex())
    crossTransfer.sideToken = crossTransferEvent.originalTokenAddress.toHex()
    crossTransfer.amount = decimal.fromBigInt(crossTransferEvent.amount, crossTransferEvent.decimals)
    crossTransfer.createdAtTx = crossTransferEvent.transaction.id
    crossTransfer.createdAtTimestamp = crossTransferEvent.transaction.timestamp
    crossTransfer.save()
  }
  return crossTransfer
}

export const createAndReturnSideToken = (sideTokenAddress: Address, event: NewSideTokenEvent, transaction: Transaction): SideToken => {
  let sideToken = SideToken.load(sideTokenAddress.toHex())
  if (sideToken == null) {
    sideToken = new SideToken(sideTokenAddress.toHex())
    sideToken.originalTokenAddress = event.params._originalTokenAddress
    sideToken.sideTokenAddress = event.params._newSideTokenAddress
    sideToken.newSymbol = event.params._newSymbol
    sideToken.granularity = event.params._granularity
    sideToken.createdAtTx = transaction.id
    sideToken.updatedAtTx = transaction.id
    sideToken.save()
  }
  return sideToken
}

export function isETHBridge(address: string): boolean {
  // TODO: this is mainnet value only, find a way to test for testnet as well
  return address == '0x1ccad820b6d031b41c54f1f3da11c0d48b399581'
}

export function isBSCBridge(address: string): boolean {
  // TODO: this is mainnet value only, find a way to test for testnet as well
  return address == '0x971b97c8cc82e7d27bc467c2dc3f219c6ee2e350'
}
