/**
 * This script handles the case where an address changes but the relevant parts of the abi remain the same
 */

const yaml = require('js-yaml');
const { dump } = require('js-yaml')
const fs = require('fs-extra');
const { newDataSources } = require('./changeBlocks')

function scaffoldChangeBlocks(dataSourceArr) {
    try {
        let doc = yaml.load(fs.readFileSync('./subgraph.yaml', 'utf8'));
        // console.log(doc)

        for (const contractObj of dataSourceArr) {
            const originalContract = doc.dataSources.find(item => item.name === contractObj.originalName)

            if (!originalContract) {
                console.error("ERROR: Original contract is not in the subgraph.yaml. Check for spelling errors in originalName property.")
                return
            }

            let index = doc.dataSources.indexOf(originalContract) + 1

            for (const contract of contractObj.changeBlocks) {
                /** Check if datasource already exists */
                const alreadyExists = doc.dataSources.find(item => item.name === contract.name)
                if (alreadyExists) {
                    console.log(`Not scaffolding ${contract.name}. It already exists.`)
                } else {
                    const newSource = JSON.parse(JSON.stringify(originalContract))
                    newSource.source.address = contract.address
                    newSource.source.startBlock = contract.startBlock
                    newSource.name = contract.name
                    /** Insert new data source into yml json */
                    doc.dataSources.splice(index, 0, newSource)
                    index++
                    console.log(`Scaffolded ${contract.name}`)

                }
            }
        }

        /** Convert json back to yaml */
        const newYamlDoc = dump(doc, { lineWidth: -1 })

        /** Rewrite subgraph.yaml with new content */
        fs.writeFile('./subgraph.yaml', newYamlDoc)

    } catch (e) {
        console.log(e);
    }
}

scaffoldChangeBlocks(newDataSources)