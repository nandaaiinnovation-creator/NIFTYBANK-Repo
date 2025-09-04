import React, { useState } from 'react';
import RuleCard from './RuleCard';
import SignalCard from './SignalCard';
import TechStackCard from './TechStackCard';
import MockupDashboard from './MockupDashboard';
import { tradingRules, frontendTech, backendTech, exampleSignal1, exampleSignal2 } from '../constants';

// --- CONTENT COMPONENTS ---
const OverviewContent: React.FC = () => (
  <>
    <p className="text-gray-400 leading-relaxed mb-3 text-sm">
      This is a fully functional, end-to-end web application designed to generate real-time trading signals for the BankNIFTY index. The system is architected for live market operation, processing live broker data and persisting all signals to a database.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      <div className="bg-zinc-900/50 p-2 border border-zinc-700">
        <h3 className="font-semibold text-md text-green-400 mb-2">What's Completed?</h3>
        <ul className="list-disc list-inside text-gray-400 space-y-1.5 text-xs">
          <li>Complete End-to-End Application (Frontend, Backend, DB).</li>
          <li>Live Broker Integration with Zerodha Kite API.</li>
          <li>Stateful Price Action Engine for real-time analysis.</li>
          <li>Database Persistence for all signals and configurations.</li>
        </ul>
      </div>
      <div className="bg-zinc-900/50 p-2 border border-zinc-700">
        <h3 className="font-semibold text-md text-orange-400 mb-2">Next Steps to Go-Live</h3>
        <ul className="list-disc list-inside text-gray-400 space-y-1.5 text-xs">
          <li>Deploy full stack to a cloud server using Docker.</li>
          <li>Implement live monitoring and alerting (e.g., Sentry).</li>
          <li>Fine-tune rule weights based on live performance data.</li>
          <li>Backfill database with historical data for robust backtesting.</li>
        </ul>
      </div>
    </div>
  </>
);

const FunctionalRequirementsContent: React.FC = () => (
  <ul className="list-disc list-inside text-gray-400 space-y-2 text-sm">
    <li><strong>Real-time Signal Generation:</strong> Continuously process live market data to generate BUY, SELL, or NEUTRAL signals based on the Price Action Engine.</li>
    <li><strong>Clear User Interface:</strong> Display generated signals prominently with all relevant details for quick interpretation.</li>
    <li><strong>Active Notifications:</strong> Provide non-intrusive on-screen alerts for newly generated signals.</li>
    <li><strong>Signal Storage & History:</strong> Log all generated signals with timestamps and rule details for post-market analysis and user learning.</li>
    <li><strong>Market Sentiment Analysis:</strong> Display a real-time gauge of market sentiment derived from component stock data and options OI.</li>
  </ul>
);

const DataSourcesContent: React.FC = () => (
    <>
        <p className="text-gray-400 mb-3 text-sm">The system requires real-time and historical data from a reliable broker API/WebSocket like Zerodha (Kite Connect) or Upstox.</p>
        <ul className="list-disc list-inside text-gray-400 space-y-2 text-sm">
            <li><strong>Live Data (WebSocket):</strong> Live ticks and 1/3 minute candlestick data for BankNIFTY index and its 10 component stocks.</li>
            <li><strong>Component Stocks:</strong> HDFC, ICICI, Axis, Kotak, SBI, IndusInd, Federal Bank, IDFC First, Bank of Baroda, AU Small Finance.</li>
            <li><strong>Historical & Pre-market Data (API):</strong> Previous day's High, Low, Close (fetched at 08:55 AM IST), Today’s Open.</li>
            <li><strong>Options Data:</strong> Real-time Open Interest (OI) data for BankNIFTY and component stocks.</li>
        </ul>
    </>
);

const TradingLogicContent: React.FC = () => (
  <>
    <p className="text-gray-400 mb-3 text-sm">The core Price Action Engine evaluates the market against a set of 12+ rules. A signal's conviction is calculated based on the rules passed and their assigned weight.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
      {tradingRules.map((rule) => ( <RuleCard key={rule.title} title={rule.title} description={rule.description} /> ))}
    </div>
  </>
);

const SignalNotificationContent: React.FC = () => (
  <>
    <p className="text-gray-400 mb-4 text-sm">Each signal is structured for maximum clarity, providing all necessary information at a glance. Below are two examples:</p>
    <div className="flex flex-wrap gap-4 justify-center">
      <SignalCard signal={exampleSignal1} />
      <SignalCard signal={exampleSignal2} />
    </div>
  </>
);

const UIDesignContent: React.FC = () => (
    <>
        <p className="text-gray-400 mb-4 text-sm">The UI is designed with a "dark mode" theme, common in trading platforms to reduce eye strain. The focus is on clarity, usability, and quick information access. Key elements include a dashboard with the latest signal, market sentiment, and a log of recent signals.</p>
        <MockupDashboard />
    </>
);

const TechStackContent: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <h3 className="text-md font-semibold text-white mb-2 flex items-center"><i className="fa-brands fa-react mr-2 text-cyan-400"></i>Front-end</h3>
            <div className="space-y-2">
                {frontendTech.map((tech) => ( <TechStackCard key={tech.name} name={tech.name} description={tech.description} icon={tech.icon} /> ))}
            </div>
        </div>
        <div>
            <h3 className="text-md font-semibold text-white mb-2 flex items-center"><i className="fa-brands fa-node-js mr-2 text-green-400"></i>Back-end</h3>
            <div className="space-y-2">
                {backendTech.map((tech) => ( <TechStackCard key={tech.name} name={tech.name} description={tech.description} icon={tech.icon} /> ))}
            </div>
        </div>
    </div>
);
const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => <pre className="bg-zinc-900 p-2 text-xs text-cyan-300 font-mono overflow-x-auto my-2 border border-zinc-700"><code>{children}</code></pre>;
const Badge: React.FC<{ children: React.ReactNode; className: string }> = ({ children, className }) => <span className={`px-2 py-0.5 rounded text-[10px] font-semibold text-white ${className}`}>{children}</span>;

const APISpecificationContent: React.FC = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-md font-semibold text-white mb-2 flex items-center"><i className="fas fa-network-wired mr-2 text-cyan-400"></i>WebSocket for Live Signals</h3>
        <p className="text-gray-400 mb-2 text-sm">The server pushes new signals to connected clients via a `new_signal` event and market data via `market_tick`.</p>
        <CodeBlock>{`{ "type": "new_signal", "payload": { ...signal_object } }
{ "type": "market_tick", "payload": { "price": 54001.25, "time": "..." } }`}</CodeBlock>
      </div>
      <div>
        <h3 className="text-md font-semibold text-white mb-2 flex items-center"><i className="fas fa-server mr-2 text-cyan-400"></i>REST API Endpoints</h3>
        <p className="text-gray-400 mb-2 text-sm">HTTP endpoints for non-real-time actions.</p>
        <div className="mt-2 space-y-3">
            <div>
                <div className="flex items-center gap-2"><Badge className="bg-blue-600">POST</Badge><code className="text-sm text-gray-300">/api/broker/connect</code></div>
                <p className="text-xs text-gray-500 mt-1">Establishes a session with the broker.</p>
            </div>
            <div>
                <div className="flex items-center gap-2"><Badge className="bg-blue-600">POST</Badge><code className="text-sm text-gray-300">/api/backtest</code></div>
                <p className="text-xs text-gray-500 mt-1">Runs a historical backtest.</p>
            </div>
            <div>
                <div className="flex items-center gap-2"><Badge className="bg-blue-600">POST</Badge><code className="text-sm text-gray-300">/api/rules</code></div>
                <p className="text-xs text-gray-500 mt-1">Saves a user's custom rule configuration.</p>
            </div>
        </div>
      </div>
    </div>
);

const BackendImplementationContent: React.FC = () => (
     <div className="space-y-3 text-sm">
        <p className="text-gray-400">The complete, ready-to-run Node.js backend code is in the <code className="text-cyan-300 bg-zinc-900/50 px-1 py-0.5">/backend</code> directory.</p>
        <div>
            <h3 className="text-md font-semibold text-white mb-1">File: <code className="text-cyan-300">backend/server.js</code></h3>
            <p className="text-gray-400 text-xs">Sets up the Express server, WebSocket server, database connection, and API endpoints.</p>
        </div>
        <div>
            <h3 className="text-md font-semibold text-white mb-1">File: <code className="text-cyan-300">backend/PriceActionEngine.js</code></h3>
            <p className="text-gray-400 text-xs">Contains the core trading logic: connects to broker, processes ticks, evaluates rules, and generates signals.</p>
        </div>
    </div>
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

// FIX: Removed invalid backslash from template literal declaration
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
      # CRITICAL: Replace these with your production values
      - DATABASE_URL=postgresql://user:password@db:5432/trading_signals
    depends_on:
      db:
        condition: service_healthy
    restart: always

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      # Binds container's port 80 to host's port 80 (standard HTTP)
      - "80:80"
    depends_on:
      - backend
    restart: always

  db:
    image: postgres:14-alpine
    restart: always
    volumes:
      # This ensures your database data persists across container restarts
      - postgres_data:/var/lib/postgresql/data/
    environment:
      # Use strong, unique passwords in production
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=trading_signals
    ports:
      # Expose the DB port for direct access if needed (use with caution)
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d trading_signals"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
`;

// FIX: Removed invalid backslash from template literal declaration
const nginxConfig = `
server {
    listen 80;
    server_name your_domain.com; # Replace with your domain

    # Serve static files from the build directory
    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API and WebSocket requests to the backend
    location /api {
        proxy_pass http://backend:8080; # 'backend' is the service name
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Handle the root path for WebSocket connection
    location = / {
        proxy_pass http://backend:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
`;

const DeploymentGuideContent: React.FC = () => (
    <div className="space-y-4">
        <p className="text-gray-400 text-sm">To take this application live, you need to deploy it to a server on the internet. This guide outlines the complete process using Docker, which is the recommended method for creating a consistent and reproducible production environment.</p>

        <div className="bg-zinc-900/50 p-3 border border-zinc-700">
            <h3 className="font-semibold text-white mb-2 text-md"><i className="fas fa-check-double mr-2 text-cyan-400"></i>Step 1: Prerequisites</h3>
            <ul className="list-disc list-inside text-gray-400 space-y-2 text-xs">
                <li><strong>Docker Desktop:</strong> Ensure Docker and Docker Compose are installed on your local machine for testing.</li>
                <li><strong>Cloud Server (VPS):</strong> You need a Virtual Private Server from a cloud provider. Popular choices include DigitalOcean, Linode, or AWS EC2. A basic server with 2GB RAM is a good starting point.</li>
                <li><strong>Domain Name (Optional):</strong> For a professional setup, you'll want a domain name pointing to your server's IP address.</li>
            </ul>
        </div>

        <div className="bg-zinc-900/50 p-3 border border-zinc-700">
            <h3 className="font-semibold text-white mb-2 text-md"><i className="fas fa-file-code mr-2 text-cyan-400"></i>Step 2: Review Docker Configuration Files</h3>
            <p className="text-gray-400 mb-2 text-xs">The project root already contains the necessary files to containerize the entire application.</p>
            
            <h4 className="font-semibold text-white mb-1 mt-2 text-sm">`Dockerfile.backend`</h4>
            <CodeBlock>{dockerfileBackend}</CodeBlock>

            <h4 className="font-semibold text-white mb-1 mt-3 text-sm">`Dockerfile.frontend`</h4>
            <CodeBlock>{dockerfileFrontend}</CodeBlock>

             <h4 className="font-semibold text-white mb-1 mt-3 text-sm">`docker-compose.yml`</h4>
             <div className="text-xs text-yellow-400 my-2 p-2 bg-yellow-900/20 border-l-4 border-yellow-500 rounded"><i className="fa-solid fa-circle-info mr-2"></i>**Important:** Before deploying, you MUST change the default `POSTGRES_USER` and `POSTGRES_PASSWORD` in this file to secure your database.</div>
            <CodeBlock>{dockerComposeYml}</CodeBlock>
        </div>

        <div className="bg-zinc-900/50 p-3 border border-zinc-700">
            <h3 className="font-semibold text-white mb-2 text-md"><i className="fas fa-rocket mr-2 text-cyan-400"></i>Step 3: Deploy to Your Cloud Server</h3>
             <p className="text-gray-400 mb-2 text-xs">Once you have your cloud server set up, follow these steps:</p>
            <ol className="list-decimal list-inside text-gray-400 space-y-2 text-xs">
                 <li><strong>Connect to your server:</strong> Use SSH to connect to your new server (e.g., `ssh root@your_server_ip`).</li>
                 <li><strong>Install Docker:</strong> Follow the official Docker documentation to install Docker and Docker Compose on your server's operating system.</li>
                 <li><strong>Copy your project:</strong> Transfer your entire project folder to the server using `scp` or by cloning it from a `git` repository.</li>
                 <li><strong>Navigate to your project directory:</strong> `cd your-project-name`</li>
                 <li><strong>Build and run the application:</strong> Use the single Docker Compose command to build the images and start all services in the background.</li>
            </ol>
            <CodeBlock>{`# This command will build the images and start the containers
docker-compose up --build -d`}</CodeBlock>
            <p className="text-gray-400 mt-2 text-xs">Your application is now live! The frontend will be accessible by visiting your server's IP address (e.g., `http://your_server_ip`) in a web browser.</p>
        </div>
        
        <div className="bg-zinc-900/50 p-3 border border-zinc-700">
            <h3 className="font-semibold text-white mb-2 text-md"><i className="fas fa-shield-alt mr-2 text-cyan-400"></i>Step 4: (Recommended) Production Setup with Nginx & SSL</h3>
            <p className="text-gray-400 mb-2 text-xs">For a production-ready setup, you should run your Docker containers behind a reverse proxy like Nginx (installed on the host server, not in Docker) and secure your site with an SSL certificate using Certbot (for free HTTPS).</p>
            <p className="text-gray-400 mb-2 text-xs">An Nginx configuration file on the host server would handle routing traffic to the correct containers. A sample configuration might look like this:</p>
            <CodeBlock>{nginxConfig}</CodeBlock>
        </div>
    </div>
);


const MarketSentimentContent: React.FC = () => (
     <p className="text-gray-400 leading-relaxed text-sm">
        Market sentiment is judged by aggregating multiple factors in real-time. The application will analyze the alignment between the BankNIFTY index movement and the price action of its major weighted components (e.g., HDFC, ICICI). Strong positive sentiment is indicated when the index and key components are all showing bullish signs. Divergence, where the index moves up but key components are weak, suggests poor sentiment and would lower signal conviction. This data, combined with Options OI, provides a robust, real-time sentiment gauge.
    </p>
);

const FeedbackMechanismContent: React.FC = () => (
     <p className="text-gray-400 leading-relaxed text-sm">
        All generated signals are timestamped and stored in a database. The application will feature a "Historical Analysis" section where users can review past signals on a chart. For each signal, they can see which rules passed/failed and analyze the market conditions at that time. This creates a powerful feedback loop, allowing users to learn the logic, build trust in the system, and understand why certain signals performed well or poorly.
    </p>
);

const RecommendationsContent: React.FC = () => (
    <>
        <p className="text-gray-400 mb-4 text-sm">
            With the core system now fully operational, future enhancements can focus on integrating more sophisticated data sources and analytical techniques to further increase signal accuracy and provide a deeper market understanding.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-zinc-900/50 p-3 border border-zinc-700">
                <h4 className="font-semibold text-white mb-2 text-md">Original Recommendations</h4>
                <ul className="list-disc list-inside text-gray-400 space-y-2 text-xs">
                    <li><strong>Order Flow & Depth Analysis:</strong> Integrate Level 2 market depth data to analyze the order book for absorption and large orders, providing a leading indicator for price moves.</li>
                    <li><strong>Volatility Regime Filtering:</strong> Incorporate India VIX and historical volatility calculations. Use different rule weights or strategies for high-volatility vs. low-volatility environments.</li>
                    <li><strong>Automated Strategy Optimization:</strong> Use genetic algorithms to continuously run backtests in the background, automatically discovering more optimal weights and rule combinations over time.</li>
                    <li><strong>Inter-market Correlation Analysis:</strong> Analyze correlations with other key instruments like NIFTY 50 or USD/INR. A signal is stronger if confirmed by correlated market movements.</li>
                    <li><strong>News Sentiment NLP:</strong> Integrate a real-time news feed API and use Natural Language Processing (NLP) to gauge sentiment from financial news, flagging signals that occur during major events.</li>
                </ul>
            </div>
            <div className="bg-zinc-900/50 p-3 border border-zinc-700">
                <h4 className="font-semibold text-white mb-2 text-md">Further Suggestions for Reliability</h4>
                <ul className="list-disc list-inside text-gray-400 space-y-2 text-xs">
                    <li><strong>Market Regime Detection:</strong> Implement an explicit module to classify the market as 'Trending', 'Ranging', or 'Volatile'. Apply different, specialized rule sets for each regime to improve adaptability.</li>
                    <li><strong>Time-of-Day Pattern Analysis:</strong> Weight signals differently based on the time of day. For example, give less weight to signals during the typically choppy mid-day session and more to breakouts in the opening hour.</li>
                    <li><strong>Dynamic Risk Management (ATR):</strong> Instead of fixed percentage stop-loss/take-profit, calculate these levels dynamically using the Average True Range (ATR) to adapt to current market volatility.</li>
                    <li><strong>Ensemble Machine Learning Models:</strong> For the ML module, use an ensemble of diverse models (e.g., Random Forest, Gradient Boosting, LSTM). A consensus from multiple models provides a much higher-confidence signal.</li>
                    <li><strong>Confirmation from Multiple Timeframes:</strong> A 5-minute buy signal is significantly more reliable if the 15-minute and 60-minute charts are also in a clear uptrend. Add this as a high-weight confirmation rule.</li>
                </ul>
            </div>
        </div>
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
        'Future Recommendations': <RecommendationsContent />,
    }
};

type Category = keyof typeof architectureSections;
type AnySubCategory = { [K in Category]: keyof (typeof architectureSections)[K] }[Category];

const SystemArchitecture: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState<Category>('System Design');
    const [activeSubCategory, setActiveSubCategory] = useState<AnySubCategory>('UI Design');

    const handleCategoryClick = (category: Category) => {
        setActiveCategory(category);
        const firstSubCategory = Object.keys(architectureSections[category])[0] as AnySubCategory;
        setActiveSubCategory(firstSubCategory);
    };
    
    const ActiveComponent = (architectureSections[activeCategory] as any)[activeSubCategory];
    
    return (
        <div className="bg-zinc-800 p-2 border border-zinc-700">
             <div className="flex items-center mb-3">
                <i className="fa-solid fa-sitemap text-lg text-cyan-400 mr-3"></i>
                <h2 className="text-lg font-semibold text-white">System Architecture</h2>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
                <aside className="md:w-52 flex-shrink-0">
                    <nav className="flex flex-col space-y-1">
                        {(Object.keys(architectureSections) as Category[]).map(category => (
                            <button 
                                key={category} 
                                onClick={() => handleCategoryClick(category)}
                                className={`px-3 py-1.5 text-left font-semibold text-xs transition-colors ${activeCategory === category ? 'bg-cyan-500/10 text-cyan-300' : 'text-gray-300 hover:bg-zinc-700/50'}`}
                            >
                                {category}
                            </button>
                        ))}
                    </nav>
                </aside>
                <main className="flex-1 min-w-0">
                     <div className="border-b border-zinc-700 mb-2">
                        <nav className="-mb-px flex gap-3 overflow-x-auto" aria-label="Tabs">
                             {(Object.keys(architectureSections[activeCategory]) as AnySubCategory[]).map(subCategory => (
                                 <button
                                    key={subCategory}
                                    onClick={() => setActiveSubCategory(subCategory)}
                                    className={`px-1 pb-1.5 font-medium text-xs border-b-2 whitespace-nowrap transition-colors ${activeSubCategory === subCategory ? 'text-cyan-400 border-cyan-400' : 'text-gray-400 border-transparent hover:text-white'}`}
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