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
RUN npm install --production

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
      # IMPORTANT: Change these values for production
      - DATABASE_URL=postgresql://user:password@db:5432/trading_signals
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: trading_app_frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  db:
    image: postgres:14-alpine
    container_name: trading_app_db
    restart: always
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    environment:
      # IMPORTANT: Change these values for production
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=trading_signals
    ports:
      # For connecting with a local client like pgAdmin
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
COPY . .
RUN npm install
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
                You can host the entire application on your PC using Docker. Docker creates consistent, isolated environments. This guide walks you through setting it up. Full instructions are also available in the project's `README.md`.
            </p>

            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3"><i className="fa-solid fa-box mr-3 text-cyan-400"></i>Backend Dockerfile</h3>
                    <p className="text-gray-400 mb-4">Create a file named <code className="text-xs bg-gray-700 px-1 rounded">Dockerfile.backend</code> in your root project directory. This defines how to build the backend image.</p>
                    <CodeBlock>{dockerfileBackend}</CodeBlock>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-3"><i className="fa-solid fa-box-open mr-3 text-cyan-400"></i>Frontend Dockerfile</h3>
                    <p className="text-gray-400 mb-4">Create a file named <code className="text-xs bg-gray-700 px-1 rounded">Dockerfile.frontend</code> in the root project directory. This builds the React app and serves it with Nginx.</p>
                    <CodeBlock>{dockerfileFrontend}</CodeBlock>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-3"><i className="fa-solid fa-boxes-packing mr-3 text-cyan-400"></i>Docker Compose</h3>
                    <p className="text-gray-400 mb-4">This file orchestrates our multi-container application. Create a file named <code className="text-xs bg-gray-700 px-1 rounded">docker-compose.yml</code> in your project's root directory.</p>
                    <CodeBlock>{dockerComposeYml}</CodeBlock>
                </div>
                
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3"><i className="fa-solid fa-play-circle mr-3 text-cyan-400"></i>Running the Application</h3>
                    <p className="text-gray-400 mb-4">With all files in place, launch the stack with a single command from your project's root directory. Make sure Docker Desktop is running.</p>
                    <CodeBlock>{`# Build and start all services
docker-compose up --build`}</CodeBlock>
                    <p className="text-gray-400 my-4">After a minute, the app should be at <code className="text-xs bg-gray-700 px-1 rounded">http://localhost</code>. To stop it:</p>
                    <CodeBlock>{`# Stop and remove all containers
docker-compose down`}</CodeBlock>
                </div>
            </div>
        </SectionCard>
    );
};

export default DeploymentGuide;
