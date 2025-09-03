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

EXPOSE 8080
CMD ["node", "server.js"]
`;

const dockerComposeYml = `
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/trading_signals
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  db:
    image: postgres:14-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=trading_signals
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d trading_signals"]
`;

const dockerfileFrontend = `
# Stage 1: Build the React app
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;


const DeploymentGuide: React.FC = () => {
    return (
        <SectionCard title="Deployment Guide (Docker)" iconClass="fa-brands fa-docker">
            <p className="text-gray-400 mb-6">
                You can host the entire application on your PC using Docker. Docker creates consistent, isolated environments. This guide shows the configuration used. Full instructions are available in the project's `README.md`.
            </p>

            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3"><i className="fa-solid fa-box mr-3 text-cyan-400"></i>Backend Dockerfile</h3>
                    <p className="text-gray-400 mb-4">The file <code className="text-xs bg-gray-700 px-1 rounded">Dockerfile.backend</code> in the root directory defines how to build the backend image.</p>
                    <CodeBlock>{dockerfileBackend}</CodeBlock>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-3"><i className="fa-solid fa-box-open mr-3 text-cyan-400"></i>Frontend Dockerfile</h3>
                    <p className="text-gray-400 mb-4">The file <code className="text-xs bg-gray-700 px-1 rounded">Dockerfile.frontend</code> in the root directory builds the React app and serves it with Nginx.</p>
                    <CodeBlock>{dockerfileFrontend}</CodeBlock>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-3"><i className="fa-solid fa-boxes-packing mr-3 text-cyan-400"></i>Docker Compose</h3>
                    <p className="text-gray-400 mb-4">The file <code className="text-xs bg-gray-700 px-1 rounded">docker-compose.yml</code> in the root directory orchestrates our multi-container application.</p>
                    <CodeBlock>{dockerComposeYml}</CodeBlock>
                </div>
                
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3"><i className="fa-solid fa-play-circle mr-3 text-cyan-400"></i>Running the Application</h3>
                    <p className="text-gray-400 mb-4">With all files in place, launch the stack with a single command from your project's root directory. See `README.md` for details.</p>
                    <CodeBlock>{`# Build and start all services
docker-compose up --build`}</CodeBlock>
                </div>
            </div>
        </SectionCard>
    );
};

export default DeploymentGuide;
