# FlowChat Enterprise

FlowChat is a production-oriented real-time messaging platform built with React, Node.js, Socket.IO, MongoDB, Docker, and Nginx.

## Stack

- Frontend: React 19, Vite, TypeScript, Tailwind CSS, Shadcn UI, React Router, Zustand, Axios, Socket.IO Client
- Backend: Node.js, Express.js, TypeScript, Socket.IO, JWT, bcrypt, Multer
- Database: MongoDB, Mongoose
- DevOps: Docker, Docker Compose, Nginx, GitHub Actions
- Testing: Jest, Supertest

## Project Structure

```text
flowchat/
├── frontend/
├── backend/
├── docker/
├── nginx/
├── docs/
├── README.md
├── docker-compose.yml
└── .env.example
```

## Quick Start

Copy the environment file:

```bash
cp .env.example .env
```

Start the full stack:

```bash
docker compose up --build
```

Frontend:

```text
http://localhost:3000
```

Backend API:

```text
http://localhost:4000/api
```

## Documentation

- [Installation Guide](docs/installation.md)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)

