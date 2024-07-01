# NFT AI Project

This project is a NestJS application that integrates with a Python script to generate AI images and mint NFTs. It uses MySQL for data storage, RabbitMQ for messaging, and Redis for caching.

## Prerequisites

- Node.js (v16 or later)
- Docker and Docker Compose
- Python 3.x

## Installation

1. ```docker-compose up```

2. Set ENV
```
DATABASE_HOST=db
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=rootpassword
DATABASE_NAME=nft_ai
RABBITMQ_URL=amqp://rabbitmq:5672
REDIS_URL=redis://redis:6379
MULTIVERSX_API_URL=
NFT_COLLECTION_ADDRESS=
API_NETWORK_PROVIDER=
PROXY_NETWORK_PROVIDER=
CHAIN_ID=D
OWNER_ADDRESS=
WALLET_PASSWORD=
````

The application will be available at http://localhost:3000.

Collection
```https://devnet-explorer.multiversx.com/collections/AINFT-9acb34```

Endpoints

Create Transaction: POST /transactions
[TEST] Process Transaction: POST /ai/process

Postman Collection
You can use the provided Postman collection to test the endpoints. Import the collection from the following link:
