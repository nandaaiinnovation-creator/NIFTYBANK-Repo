import React from 'react';
import SectionCard from './SectionCard';

const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <pre className="bg-gray-900 p-4 rounded-md text-sm text-cyan-300 font-mono overflow-x-auto my-2">
        <code>{children}</code>
    </pre>
);

const dockerfileBackend = `
# Stage 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY backend/package*.json ./
RUN npm install

# Stage 2: Build production image
FROM node:18-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY backend .

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD ["node", "server.js"]
`;

const dockerComposeYml = `
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: trading_app_backend
    ports:
      - "8080:8080"
    environment:
      # Use environment variables for sensitive data
      - DATABASE_URL=postgresql://user:password@db:5432/trading_signals
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: trading_app_frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  db:
    image: postgres:14-alpine
    container_name: trading_app_db
    restart: always
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=trading_signals
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d trading_signals"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
`;

const dockerfileFrontend = `
# Stage 1: Build the React app
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . ./
# This command needs to be configured in your package.json
# e.g., "build": "vite build" or "react-scripts build"
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
# If you have a custom nginx config for routing API calls, copy it here
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;


const DeploymentGuide: React.FC = () => {
    return (
        <SectionCard title="Deployment Guide (Docker)" iconClass="fa-brands fa-docker">
            <p className="text-gray-400 mb-6">
                Excellent question! Yes, you can absolutely host the entire application on your PC using Docker. Docker is a fantastic tool for creating consistent, isolated environments. This guide will walk you through setting it up.
            </p>

            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3"><i className="fa-solid fa-box mr-3 text-cyan-400"></i>Step 1: Dockerizing the Backend</h3>
                    <p className="text-gray-400 mb-4">First, we need to create a recipe for Docker to build an image of our backend. Create a file named <code className="text-xs bg-gray-700 px-1 rounded">Dockerfile.backend</code> in your root project directory.</p>
                    <CodeBlock>{dockerfileBackend}</CodeBlock>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-3"><i className="fa-solid fa-box-open mr-3 text-cyan-400"></i>Step 2: Dockerizing the Frontend</h3>
                    <p className="text-gray-400 mb-4">Similarly, we'll create a Dockerfile for the frontend. This one will build the static React files and then use a lightweight Nginx server to serve them. Create a file named <code className="text-xs bg-gray-700 px-1 rounded">Dockerfile.frontend</code> in the root project directory.</p>
                     <p className="text-sm text-yellow-400 mb-2 p-2 bg-yellow-900/20 border-l-4 border-yellow-500 rounded"><i className="fa-solid fa-circle-info mr-2"></i>Note: For this to work, your React app needs a build script in `package.json` (e.g., `"build": "vite build"`).</p>
                    <CodeBlock>{dockerfileFrontend}</CodeBlock>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-3"><i className="fa-solid fa-boxes-packing mr-3 text-cyan-400"></i>Step 3: Orchestrating with Docker Compose</h3>
                    <p className="text-gray-400 mb-4">Docker Compose allows us to define and run multi-container applications. It will manage our backend, frontend, and a PostgreSQL database all at once. Create a file named <code className="text-xs bg-gray-700 px-1 rounded">docker-compose.yml</code> in your project's root directory.</p>
                    <CodeBlock>{dockerComposeYml}</CodeBlock>
                </div>
                
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3"><i className="fa-solid fa-play-circle mr-3 text-cyan-400"></i>Step 4: Running the Application</h3>
                    <p className="text-gray-400 mb-4">With all the files in place, you can now launch the entire application stack with a single command from your project's root directory. Make sure you have Docker Desktop installed and running.</p>
                    <CodeBlock>{`# Build and start all services in the background
docker-compose up --build -d`}</CodeBlock>
                    <p className="text-gray-400 my-4">After a minute or two, the frontend should be accessible at <code className="text-xs bg-gray-700 px-1 rounded">http://localhost</code> and it will be communicating with the backend. To stop the application:</p>
                    <CodeBlock>{`# Stop and remove containers, networks, and volumes
docker-compose down`}</CodeBlock>
                </div>
            </div>
        </SectionCard>
    );
};

export default DeploymentGuide;
