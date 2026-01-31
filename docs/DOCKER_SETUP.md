# Docker Setup for Sophia Code

This document provides instructions for setting up and running the Sophia Code project using Docker Compose. Docker Compose simplifies the process of running the application by handling the setup and configuration of all required services.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- Git

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/sophia.code.git
cd sophia.code
```

2. Create environment files:

```bash
# Copy the example environment file
cp backend/.env.example backend/.env
```

3. Start the application:

```bash
docker-compose up
```

This will start the following services:

- **Frontend**: React application at http://localhost:5173
- **Backend**: NestJS API at http://localhost:3000
- **Database**: PostgreSQL at localhost:5432
- **Adminer**: Database management interface at http://localhost:8080

## Development Workflow

### Running Services Individually

You can run services individually with:

```bash
# Start only the database
docker-compose up database

# Start the backend with the database
docker-compose up database backend

# Start everything
docker-compose up
```

### Rebuilding Services

After making changes to dependencies:

```bash
docker-compose build
```

After making changes to code (without dependency changes):

```bash
docker-compose up
```

Code changes should be automatically picked up due to volume mounts.

## Database Management

Connect to the database using Adminer:

1. Open http://localhost:8080 in your browser
2. Use the following credentials:
   - System: PostgreSQL
   - Server: database
   - Username: postgres
   - Password: postgres
   - Database: sophia

## Testing

Run the tests within the Docker environment:

```bash
# Backend tests
docker-compose exec backend npm test

# Frontend tests
docker-compose exec frontend npm test
```

## Stopping the Application

To stop all running services:

```bash
# Stop services but keep containers
docker-compose stop

# Stop services and remove containers
docker-compose down

# Stop services, remove containers, and delete volumes (database data)
docker-compose down -v
```

## Production Deployment

For production deployment:

1. Build production images:

```bash
docker-compose -f docker-compose.prod.yml build
```

2. Start the production environment:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Database Connection Issues

If the backend cannot connect to the database, ensure the database service is fully initialized:

```bash
docker-compose restart backend
```

### Port Conflicts

If you encounter port conflicts, modify the port mappings in the `docker-compose.yml` file.