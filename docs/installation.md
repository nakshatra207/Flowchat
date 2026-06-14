# Installation Guide

## Prerequisites

- Node.js 22 LTS or newer
- npm 10 or newer
- Docker and Docker Compose
- Git

## Environment Setup

Create a local environment file:

```bash
cp .env.example .env
```

Update secrets before using the application outside local development:

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `MONGO_INITDB_ROOT_PASSWORD`

## Docker Development

Start all services:

```bash
docker compose up --build
```

Stop all services:

```bash
docker compose down
```

Remove service data:

```bash
docker compose down -v
```

## Local Development

Backend and frontend package scripts will be added in their implementation phases.

