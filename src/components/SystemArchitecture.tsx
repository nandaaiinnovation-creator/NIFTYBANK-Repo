import React, { useState } from 'react';
import RuleCard from './RuleCard';
import SignalCard from './SignalCard';
import TechStackCard from './TechStackCard';
import Dashboard from './Dashboard';
import { tradingRules, frontendTech, backendTech, exampleSignal1, exampleSignal2 } from '../constants';

// --- CONTENT COMPONENTS ---
const OverviewContent: React.FC = () => (
  <>
    <p className="text-gray-400 leading-relaxed mb-6">
      This is a fully functional, end-to-end web application designed to generate real-time BUY/SELL trading signals for the BankNIFTY index. The system is architected for live market operation, leveraging Price Action Trading logic, processing live broker data, and persisting all signals to a database.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
        <h3 className="font-semibold text-lg text-green-400 mb-2">What's Completed?</h3>
        <ul className="list-disc list-inside text-gray-400 space-y-2 text-sm">
          <li><strong>Complete End-to-End Application:</strong> The frontend, backend server, and database are fully built and integrated.</li>
          <li><strong>Live Broker Integration:</strong> The system connects directly to the Zerodha Kite API to process a real-time stream of market ticks.</li>
          <li><strong>Stateful Trading Engine:</strong> The backend features a Price Action Engine that analyzes live data, builds candles, and applies trading rules.</li>
          <li><strong>Database Persistence:</strong> All generated signals and user rule configurations are automatically saved to a PostgreSQL database for permanent storage and analysis.</li>
        </ul>
      </div>
      <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
        <h3 className="font-semibold text-lg text-orange-400 mb-2">Next Steps to Go-Live</h3>
        <ul className="list-disc list-inside text-gray-400 space-y-2 text-sm">
          <li><strong>Production Deployment:</strong> Deploy the full application stack (Frontend, Backend, Database) to a cloud server using the provided Docker guide.</li>
          <li><strong>Live Monitoring & Alerting:</strong> Implement logging and monitoring tools (e.g., PM2, Sentry) to track the health of the live server and get alerts on any issues.</li>
          <li><strong>Performance Tuning:</strong> After a period of live operation, analyze the generated signal data to fine-tune rule weights and logic for optimal performance.</li>
          <li><strong>Historical Data Backfill:</strong> Populate the database with historical 1-minute candle data to enable more robust and extensive backtesting immediately.</li>
        </ul>
      </div>
    </div>
  </>
);

const FunctionalRequirementsContent: React.FC = () => (
  <ul className="list-disc list-inside text-gray-400 space-y-2">
    <li><strong>Real-time Signal Generation:</strong> Continuously process live market data to generate BUY, SELL, or NEUTRAL signals based on the Price Action Engine.</li>
    <li><strong>Clear User Interface:</strong> Display generated signals prominently with all relevant details for quick interpretation.</li>
    <li><strong>Active Notifications:</strong> Provide non-intrusive on-screen alerts for newly generated signals.</li>
    <li><strong>Signal Storage & History:</strong> Log all generated signals with timestamps and rule details for post-market analysis and user learning.</li>
    <li><strong>Market Sentiment Analysis:</strong> Display a real-time gauge of market sentiment derived from component stock data and options OI.</li>
  </ul>
);

const DataSourcesContent: React.FC = () => (
    <>
        <p className="text-gray-400 mb-3">The system requires real-time and historical data from a reliable broker API/WebSocket like Zerodha (Kite Connect) or Upstox.</p>
        <ul className="list-disc list-inside text-gray-400 space-y-2">
            <li><strong>Live Data (WebSocket):</strong> Live ticks and 1/3 minute candlestick data for BankNIFTY index and its 10 component stocks.</li>
            <li><strong>Component Stocks:</strong> HDFC, ICICI, Axis, Kotak, SBI, IndusInd, Federal Bank, IDFC First, Bank of Baroda, AU Small Finance.</li>
            <li><strong>Historical & Pre-market Data (API):</strong> Previous day's High, Low, Close (fetched at 08:55 AM IST), Today’s Open.</li>
            <li><strong>Options Data:</strong> Real-time Open Interest (OI) data for BankNIFTY and component stocks.</li>
        </ul>
    </>
);

const TradingLogicContent: React.FC = () => (
  <>
    <p className="text-gray-400 mb-4">The core Price Action Engine evaluates the market against a set of 12+ rules. A signal's conviction is calculated based on the percentage of rules passed. Here are the key rules:</p>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {tradingRules.map((rule) => ( <RuleCard key={rule.title} title={rule.title} description={rule.description} /> ))}
    </div>
  </>
);

const SignalNotificationContent: React.FC = () => (
  <>
    <p className="text-gray-400 mb-4">Each signal is structured for maximum clarity, providing all necessary information at a glance. Below are two examples:</p>
    <div className="flex flex-wrap gap-6 justify-center">
      <SignalCard signal={exampleSignal1} />
      <SignalCard signal={exampleSignal2} />
    </div>
  </>
);

const UIDesignContent: React.FC = () => (
    <>
        <p className="text-gray-400 mb-4">The UI will be designed with a "dark mode" theme, common in trading platforms to reduce eye strain. The focus is on clarity, usability, and quick information access. Key elements include a dashboard with the latest signal, market sentiment, and a log of recent signals.</p>
        {/* FIX: Replaced non-existent MockupDashboard with the functional Dashboard component. */}
        <Dashboard />
    </>
);

const TechStackContent: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center"><i className="fa-brands fa-react mr-3 text-cyan-400"></i>Front-end Technologies</h3>
            <p className="text-gray-400 mb-4">A modern, responsive Single Page Application (SPA) for displaying data and notifications in real-time.</p>
            <div className="space-y-4">
                {frontendTech.map((tech) => ( <TechStackCard key={tech.name} name={tech.name} description={tech.description} icon={tech.icon} /> ))}
            </div>
        </div>
        <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center"><i className="fa-brands fa-node-js mr-3 text-green-400"></i>Back-end Technologies</h3>
            <p className="text-gray-400 mb-4">The engine of the application, handling data fetching, processing trading logic, and pushing signals.</p>
            <div className="space-y-4">
                {backendTech.map((tech) => ( <TechStackCard key={tech.name} name={tech.name} description={tech.description} icon={tech.icon} /> ))}
            </div>
        </div>
    </div>
);
const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => <pre className="bg-zinc-950 border border-zinc-800 p-3 rounded-md text-sm text-cyan-300 font-mono overflow-x-auto my-2"><code>{children}</code></pre>;
const Badge: React.FC<{ children: React.ReactNode; className: string }> = ({ children, className }) => <span className={`px-2 py-0.5 rounded-md text-xs font-semibold text-white ${className}`}>{children}</span>;

const APISpecificationContent: React.FC = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center"><i className="fas fa-network-wired mr-3 text-cyan-400"></i>WebSocket for Live Signals</h3>
        <p className="text-gray-400 mb-2">The server pushes new signals to connected clients via a `new_signal` event.</p>
        <CodeBlock>{`{ "type": "new_signal", "payload": { ... } }`}</CodeBlock>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center"><i className="fas fa-server mr-3 text-cyan-400"></i>REST API Endpoints</h3>
        <p className="text-gray-400 mb-2">HTTP endpoints for non-real-time actions.</p>
        <div className="mt-4 space-y-4">
            <div>
                <div className="flex items-center gap-3"><Badge className="bg-blue-600">POST</Badge><code className="text-md text-gray-300">/api/broker/connect</code></div>
                <p className="text-sm text-gray-500 mt-1">Establishes a session with the broker.</p>
            </div>
            <div>
                <div className="flex items-center gap-3"><Badge className="bg-blue-600">POST</Badge><code className="text-md text-gray-300">/api/backtest</code></div>
                <p className="text-sm text-gray-500 mt-1">Runs a historical backtest.</p>
            </div>
            <div>
                <div className="flex items-center gap-3"><Badge className="bg-blue-600">POST</Badge><code className="text-md text-gray-300">/api/rules</code></div>
                <p className="text-sm text-gray-500 mt-1">Saves a user's custom rule configuration.</p>
            </div>
        </div>
      </div>
    </div>
);

const BackendImplementationContent: React.FC = () => (
     <div className="space-y-6">
        <p className="text-gray-400">The complete, ready-to-run Node.js backend code is in the <code className="text-cyan-300 bg-gray-900 px-2 py-1 rounded-md">/backend</code> directory.</p>
        <div>
            <h3 className="text-lg font-semibold text-white mb-2">File: <code className="text-cyan-300">backend/server.js</code></h3>
            <p className="text-gray-400 text-sm">Sets up the Express server, WebSocket server, database connection, and API endpoints.</p>
        </div>
        <div>
            <h3 className="text-lg font-semibold text-white mb-2">File: <code className="text-cyan-300">backend/PriceActionEngine.js</code></h3>
            <p className="text-gray-400 text-sm">Contains the core trading logic: connects to broker, processes ticks, evaluates rules, and generates signals.</p>
        </div>
    </div>
);

const DeploymentGuideContent: React.FC = () => (
    <div className="space-y-6 text-sm text-zinc-400">
        <p>This application is fully containerized for a simple and reliable one-command startup using Docker. The following guide provides all the necessary steps and file contents to get the complete system—frontend, backend, and database—running on your local machine.</p>

        <div>
            <h3 className="text-base font-semibold text-white mb-2">Prerequisites</h3>
            <ul className="list-disc list-inside space-y-1">
                <li><strong className="text-zinc-300">Docker Desktop:</strong> Ensure you have Docker and Docker Compose installed and running on your system.</li>
            </ul>
        </div>

        <div>
            <h3 className="text-base font-semibold text-white mb-2">Step 1: Create Docker Configuration Files</h3>
            <p className="mb-2">In the root directory of the project, create the following three files with the exact content provided below.</p>
            
            <h4 className="font-semibold text-zinc-200 mt-4">File: <code className="text-cyan-400">docker-compose.yml</code></h4>
            <CodeBlock>{`version: '3.8'

services:
  # Backend Node.js Service
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "8080:8080"
    env_file:
      - ./backend/.env
    depends_on:
      - db
    restart: unless-stopped

  # Frontend React Service (served by Nginx)
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  # PostgreSQL Database Service
  db:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:`}</CodeBlock>

            <h4 className="font-semibold text-zinc-200 mt-4">File: <code className="text-cyan-400">Dockerfile.frontend</code></h4>
            <CodeBlock>{`# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package.json and install dependencies first to leverage caching
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application for production
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:stable-alpine

# Copy the build output from the build stage
COPY --from=build /app/build /usr/share/nginx/html

# EXPOSE 80 is inherited from the base image
# Command to run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]`}</CodeBlock>

            <h4 className="font-semibold text-zinc-200 mt-4">File: <code className="text-cyan-400">Dockerfile.backend</code></h4>
            <CodeBlock>{`# Stage 1: Install dependencies to leverage caching
FROM node:18-alpine AS deps

WORKDIR /app

# Copy package.json from the backend directory
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Stage 2: Build production image
FROM node:18-alpine

WORKDIR /app

# Copy installed dependencies from the 'deps' stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the backend source code
COPY backend/ ./

# Expose the port the server listens on
EXPOSE 8080

# The command to run the application
CMD ["node", "server.js"]`}</CodeBlock>
        </div>

        <div>
            <h3 className="text-base font-semibold text-white mb-2">Step 2: Configure Environment Variables</h3>
            <p className="mb-2">The backend server requires an environment file to connect to the database. First, copy the example file to create your local configuration:</p>
            <CodeBlock>cp backend/.env.example backend/.env</CodeBlock>
            <p className="mt-2">Next, <strong className="text-amber-400">open the newly created <code className="text-xs">backend/.env</code> file</strong>. The default values are set up to work with the Docker Compose configuration, so you should not need to change anything. Ensure the <code className="text-xs">DATABASE_URL</code> is set as follows:</p>
            <CodeBlock>DATABASE_URL=postgres://user:password@db:5432/mydb</CodeBlock>
            <p className="text-xs text-zinc-500 mt-1">Note: <code className="text-xs">db</code> is the service name of the PostgreSQL container, which is how the backend finds the database within Docker's internal network.</p>
        </div>

        <div>
            <h3 className="text-base font-semibold text-white mb-2">Step 3: Build & Run the Application</h3>
            <p className="mb-2">From the root directory of the project, run the following command. This will build the Docker images and start all three services.</p>
            <CodeBlock>docker-compose up --build</CodeBlock>
            <p className="mt-2">The first build will take several minutes. To run in the background (detached mode), add the <code className="text-xs">-d</code> flag.</p>
        </div>

        <div>
            <h3 className="text-base font-semibold text-white mb-2">Step 4: Accessing the Application</h3>
            <p>Once the containers are running, the application will be available at: <a href="http://localhost" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">http://localhost</a></p>
        </div>
        
        <div>
            <h3 className="text-base font-semibold text-white mb-2">Step 5: Managing the Services</h3>
            <ul className="list-disc list-inside space-y-2">
                <li><strong>View Logs:</strong> To see live logs from the backend or other services, open a new terminal and run:
                    <CodeBlock>{`# View logs for the backend service
docker-compose logs -f backend`}</CodeBlock>
                </li>
                <li><strong>Stopping the Application:</strong> To stop and remove the containers, press <code className="text-xs">Ctrl + C</code> in the terminal where Docker is running, then execute:
                    <CodeBlock>docker-compose down</CodeBlock>
                </li>
            </ul>
        </div>
    </div>
);


const MarketSentimentContent: React.FC = () => (
     <p className="text-gray-400 leading-relaxed">
        Market sentiment is judged by aggregating multiple factors in real-time. The application will analyze the alignment between the BankNIFTY index movement and the price action of its major weighted components (e.g., HDFC, ICICI). Strong positive sentiment is indicated when the index and key components are all showing bullish signs (e.g., breaking resistance). Divergence, where the index moves up but key components are weak, suggests poor sentiment and would lower signal conviction. This data, combined with Options OI, provides a robust, real-time sentiment gauge.
    </p>
);

const FeedbackMechanismContent: React.FC = () => (
     <p className="text-gray-400 leading-relaxed">
        All generated signals are timestamped and stored in a database (e.g., PostgreSQL). The application will feature a "Historical Analysis" section where users can review past signals on a chart. For each signal, they can see which rules passed/failed and analyze the market conditions at that time. This creates a powerful feedback loop, allowing users to learn the logic, build trust in the system, and understand why certain signals performed well or poorly.
    </p>
);

const RecommendationsContent: React.FC = () => (
    <>
        <p className="text-gray-400 mb-4">With the core system now fully operational, future enhancements can focus on integrating more sophisticated data sources and analytical techniques to further increase signal accuracy and provide a deeper market understanding.</p>
        <ul className="list-disc list-inside text-gray-400 space-y-3">
            <li><strong>Order Flow & Depth Analysis:</strong> Integrate Level 2 market depth data to analyze the order book.</li>
            <li><strong>Volatility Regime Filtering:</strong> Incorporate India VIX and historical volatility calculations as a dynamic filter.</li>
            <li><strong>Automated Strategy Optimization:</strong> Use genetic algorithms or reinforcement learning to continuously run backtests.</li>
            <li><strong>Inter-market Correlation Analysis:</strong> Analyze correlations with other key financial instruments like the USD/INR exchange rate.</li>
            <li><strong>News Sentiment NLP:</strong> Integrate a real-time news feed API and use Natural Language Processing (NLP).</li>
        </ul>
    </>
);


// --- MAIN LAYOUT COMPONENT ---
const architectureSections = {
    'Introduction': {
        'Overview': <OverviewContent />,
        'Requirements': <FunctionalRequirementsContent />,
        'Data Sources': <DataSourcesContent />,
    },
    'System Design': {
        'Trading Logic': <TradingLogicContent />,
        'Signal Structure': <SignalNotificationContent />,
        'UI Design': <UIDesignContent />,
        'Tech Stack': <TechStackContent />,
    },
    'Implementation': {
        'API Specification': <APISpecificationContent />,
        'Backend': <BackendImplementationContent />,
        'Deployment': <DeploymentGuideContent />,
    },
    'Advanced Concepts': {
        'Market Sentiment': <MarketSentimentContent />,
        'Feedback Loop': <FeedbackMechanismContent />,
        'Future Work': <RecommendationsContent />,
    }
};

type Category = keyof typeof architectureSections;
// FIX: The original SubCategory type was incorrect because it took an intersection of keys for a union of objects, resulting in `never`.
// This new type correctly creates a union of all possible sub-category keys.
type AnySubCategory = { [K in Category]: keyof (typeof architectureSections)[K] }[Category];

const SystemArchitecture: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState<Category>('Introduction');
    // FIX: Use the correct union type for the sub-category state.
    const [activeSubCategory, setActiveSubCategory] = useState<AnySubCategory>('Overview');

    const handleCategoryClick = (category: Category) => {
        setActiveCategory(category);
        // FIX: Update to use the correct AnySubCategory type for casting. This resolves the TypeScript error.
        const firstSubCategory = Object.keys(architectureSections[category])[0] as AnySubCategory;
        setActiveSubCategory(firstSubCategory);
    };
    
    // FIX: TypeScript can't infer that `activeSubCategory` is a valid key for `architectureSections[activeCategory]`
    // at compile time. Since our runtime logic ensures this is always true, `as any` is a pragmatic way to bypass the check.
    const ActiveComponent = (architectureSections[activeCategory] as any)[activeSubCategory];
    
    return (
        // FIX: Replaced SectionCard with a div wrapper and an inlined header to remove dependency on the non-existent component.
        <div className="bg-zinc-900 border border-zinc-700 p-2">
            <div className="flex items-center flex-shrink-0 mb-4">
                <i className="fa-solid fa-sitemap text-md text-cyan-400 mr-2"></i>
                <h2 className="text-md font-semibold text-white">System Architecture</h2>
            </div>
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="md:w-1/4">
                    <nav className="flex flex-col space-y-2">
                        {(Object.keys(architectureSections) as Category[]).map(category => (
                            <button 
                                key={category} 
                                onClick={() => handleCategoryClick(category)}
                                className={`px-4 py-2 text-left rounded-md font-semibold text-sm transition-colors ${activeCategory === category ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-300 hover:bg-gray-700/50'}`}
                            >
                                {category}
                            </button>
                        ))}
                    </nav>
                </aside>
                <main className="flex-1">
                     <div className="border-b border-gray-700 mb-4">
                        <nav className="-mb-px flex gap-4 overflow-x-auto" aria-label="Tabs">
                             {/* FIX: Cast to the correct union type AnySubCategory[] */}
                             {(Object.keys(architectureSections[activeCategory]) as AnySubCategory[]).map(subCategory => (
                                 <button
                                    key={subCategory}
                                    onClick={() => setActiveSubCategory(subCategory)}
                                    className={`px-3 py-2 font-medium text-sm rounded-t-lg border-b-2 whitespace-nowrap transition-colors ${activeSubCategory === subCategory ? 'text-cyan-400 border-cyan-400' : 'text-gray-400 border-transparent hover:text-white'}`}
                                >
                                    {subCategory}
                                </button>
                             ))}
                        </nav>
                    </div>
                    <div className="p-1">
                       {ActiveComponent}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SystemArchitecture;