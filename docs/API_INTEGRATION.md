# Frontend-Backend API Integration

This document explains how the Sophia Code frontend integrates with the backend API using the REST interface.

## Overview

The Sophia Code application follows a typical client-server architecture:

1. **Frontend**: React application with TypeScript
2. **Backend**: NestJS API with PostgreSQL database
3. **Communication**: RESTful HTTP API

## API Authentication

Authentication is handled using a simple API key approach:

1. The API key is set in the environment variable `VITE_API_KEY` for the frontend
2. The backend checks for this key in the `X-API-Key` header of each request
3. For development, a default key is provided: `sophia_local_development_key_very_secret`

## Setting up the Integration

### Environment Variables

Create a `.env` file in the root of your project with the following variables:

```
# Frontend environment variables
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_KEY=sophia_local_development_key_very_secret
VITE_AI_PROVIDER=opencode

# These can be added if needed for AI provider integration
# VITE_ANTHROPIC_API_KEY=your_key_here
# VITE_OPENAI_API_KEY=your_key_here
```

Create a `.env` file in the `backend` directory:

```
# Backend environment variables
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=sophia
API_KEY=sophia_local_development_key_very_secret
```

### Docker Environment Setup

The easiest way to get started is using Docker Compose:

```bash
# Start all services
docker-compose up

# Start only the backend and database
docker-compose up database backend
```

### Manual Setup

If you prefer to run the services manually:

1. **Start PostgreSQL**:
   ```bash
   # Option 1: Docker
   docker run --name sophia-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sophia -p 5432:5432 -d postgres:15-alpine

   # Option 2: Local PostgreSQL
   # Create database named 'sophia'
   ```

2. **Start Backend**:
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

3. **Start Frontend**:
   ```bash
   npm install
   npm run dev
   ```

## API Endpoints

The backend provides the following RESTful endpoints:

### Health Check

- `GET /api/health`: Check API availability

### Artifacts

- `GET /api/artifacts`: Get all artifacts
- `GET /api/artifacts/:id`: Get artifact by ID
- `POST /api/artifacts`: Create a new artifact
- `PUT /api/artifacts/:id`: Update an artifact
- `DELETE /api/artifacts/:id`: Delete an artifact

## Frontend Integration

The frontend integration is handled through:

1. **API Client** (`src/lib/api/index.ts`): Base client for API requests
2. **Custom Hooks** (`src/hooks/useArtifacts.ts`): React hook for using the API
3. **Components** using the hook to display and manipulate data

## Error Handling

The API integration includes comprehensive error handling:

1. **Network errors**: Handled in the API client
2. **API errors**: The backend returns appropriate HTTP status codes and error messages
3. **UI feedback**: Loading states and error messages are displayed to users

## Data Mapping

The frontend and backend use slightly different data models:

1. **Backend Model**: Focuses on database structure and relationships
2. **Frontend Model**: Optimized for UI rendering and user interactions

The mapping between these models is handled in the API client.

## Testing

To test the API integration:

1. **Backend Tests**: `cd backend && npm test`
2. **Frontend Tests**: `npm test`
3. **E2E Tests**: Coming soon

## Troubleshooting

Common issues and solutions:

1. **Connection refused**: Ensure the backend is running and accessible
2. **Authentication errors**: Check that your API key is correctly set in both environments
3. **CORS errors**: Verify the `FRONTEND_URL` is correctly set in the backend `.env`
4. **Database errors**: Check your PostgreSQL connection and credentials