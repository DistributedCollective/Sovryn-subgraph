/**
 * This script prints the call signature of all the functions of an ABI
 * It is a work in progress,to be used for creating a csv file of all call signatures that appear in this subgraph
 */

require('dotenv').config()
const Protocol = require('@graphprotocol/graph-cli/src/protocols/')
const toolbox = require('gluegun/toolbox');
const { Command } = require('commander');
const program = new Command();
program.version('0.0.1');
const keccak256 = require('keccak256')

const protocolInstance = new Protocol('ethereum')
const ABI = protocolInstance.getABI()

async function test() {
    const filePath = 'abis/LoanTokenLogicStandard.json'
    const pathArr = filePath.split('/')
    const contractName = pathArr[pathArr.length - 1].split('.json')[0]
    console.log(contractName)
    await loadAbiFromFile(filePath).then(abi => {
        console.log(abi.callFunctionSignatures()._tail.array.map(item => `${item.slice(0, item.indexOf('('))} 0x${keccak256(item).toString('hex').slice(0, 8)}`))
    })
}


const loadAbiFromFile = async filename => {
    let exists = await toolbox.filesystem.exists(filename)
    if (!exists) {
        throw Error('File does not exist.')
    } else if (exists === 'dir') {
        throw Error('Path points to a directory, not a file.')
    } else if (exists === 'other') {
        throw Error('Not sure what this path points to.')
    } else {
        return await ABI.load('Contract', filename)
    }
}

test()