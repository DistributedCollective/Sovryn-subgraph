# Example Subgraph

## Prerequisites

* have node v12 or above installed
* have Docker and Docker Compose installed

## Start running

* clone repo
  
* npm install

* npm run prepare:RSK:testnet (this will create the docker compose file and the subgraph.yaml from the template files)
  
* docker-compose up -d
  
* npm run codegen
  
* npm run build
  
* npm run create-local
  
* npm run deploy-local
  
* go to http://localhost:8000/subgraphs/name/DistributedCollective/sovryn-subgraph/graphql


## Scaffolding:

* npm run scaffold -- -fp <abi file path> -gm -gs -a <contract address>

* npm run scaffold -- --help for more options


An example to help you get started with The Graph. For more information see the docs on https://thegraph.com/docs/.
