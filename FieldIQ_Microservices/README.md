# FieldIQ - Microservices Backend

High-performance Node.js / TypeScript microservices backend for the FieldIQ field force management platform.

## Architecture

This project follows **Clean Architecture** principles:

- **Domain**: Entities and repository interface contracts (`src/domain`)
- **Application**: Core business logic and use cases (`src/application`)
- **Infrastructure**: Database persistence (Prisma), Messaging (RabbitMQ / Redis), WebSockets (`src/infrastructure`)
- **Interfaces**: REST HTTP Controllers, Routes, Middlewares (`src/interfaces`)

## Tech Stack

- **Runtime**: Node.js, TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Messaging & Cache**: Redis & RabbitMQ
- **Real-Time**: Socket.IO
- **Containerization**: Docker & Docker Compose

## Setup & Running

### 1. Prerequisites
- Node.js (v18+)
- Docker & Docker Compose (optional, for running dependencies)

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in required values:
```bash
cp .env.example .env
```

### 3. Installation
```bash
npm install
```

### 4. Database Setup
```bash
npx prisma generate
npx prisma db push
```

### 5. Running the App
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```
