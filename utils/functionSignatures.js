/**
 * This script prints the call signature of all the functions of an ABI
 * It is a work in progress,to be used for creating a csv file of all call signatures that appear in this subgraph
 */

require('dotenv').config()
const Protocol = require('@graphprotocol/graph-cli/src/protocols/')
const toolbox = require('gluegun/toolbox');
const { Command } = require('commander');
const program = new Command();
const fs = require('fs-extra')
program.version('0.0.1');
const keccak256 = require('keccak256')
const protocolInstance = new Protocol('ethereum')
const ABI = protocolInstance.getABI()

async function main() {
    const csvFile = './functionSignatures.csv'
    fs.unlinkSync(csvFile)
    fs.createFile(csvFile)
    fs.readdir('./abisForSignatures', async (err, files) => {
        files.forEach(async (file) => {
            console.log(file)
            const filePath = `abis/${file}`
            const contractName = file.split('.json')[0]
            await loadAbiFromFile(filePath).then(abi => {
                if (abi.callFunctionSignatures()._tail !== undefined) {
                    abi.callFunctionSignatures()._tail.array.forEach(item => {
                        const functionName = item.slice(0, item.indexOf('('))
                        const signature = `0x${keccak256(item).toString('hex').slice(0, 8)}`
                        fs.appendFile(csvFile, `${contractName},${functionName},${signature}\n`)
                    }
                    )
                }
            })
        });
    });
}


const loadAbiFromFile = async filename => {
    let exists = await toolbox.filesystem.exists(filename)
    if (!exists) {
        throw Error(`File ${filename} does not exist.`)
    } else if (exists === 'dir') {
        throw Error('Path points to a directory, not a file.')
    } else if (exists === 'other') {
        throw Error('Not sure what this path points to.')
    } else {
        return await ABI.load('Contract', filename)
    }
}

main()