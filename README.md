# Idle Tranches Subgraph

This repository maintains the source code the the idle tranches subgraph, which can be accessed here: <TODO>

## Local Development Instructions
### Prerequisites
1. Docker
2. ganache-cli
3. idle-tranches and graph-node submodule loaded `git submodule update --init`
4. idle-tranches submodule configured; `cd idle-tranches && npm install` and `.env` file created
    - Additionally configure the `hardhat.config.js` file to enable forking from `blockNumber: 13147167`
5. graph-node configured - Instructions for this can be found (here)[https://thegraph.com/docs/developer/quick-start#2-run-a-local-graph-node]

## Local Development
1. Start hardhat node `yarn local-hardhat`
2. Deploy CDO Factory `cd idle-tranches && npx hardhat deploy-cdo-factory`
3. Start graph node `yarn local-graph`
    - This process may take up to 30 minutes for the first time, as the graph downloads some data from the blockchain
4. Deploy subgraph to local `yarn deploy-local-e2e`
5. Access subgraph locally `http://localhost:8000/subgraphs/name/idle-finance/idle-tranches`
