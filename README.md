# BankNIFTY Trading Signal Architect

This is a fully functional, end-to-end web application designed to generate real-time BUY/SELL trading signals for the BankNIFTY index. The system is architected for live market operation, leveraging Price Action Trading logic, processing live broker data, and persisting all signals to a database.

## Features

- **Live Signal Generation:** Connects to Zerodha Kite API for a real-time stream of market data.
- **Price Action Engine:** Core logic analyzes market data against 12+ configurable trading rules.
- **Database Persistence:** All generated signals and user configurations are saved to a PostgreSQL database.
- **Dynamic Frontend:** A React UI displays live signals on a candlestick chart and allows for deep customization of the trading logic.
- **Full Backtesting Engine:** Simulate your strategies against historical data.
- **Dockerized Deployment:** Comes with a complete Docker setup for easy deployment.

---

## How to Run

You have two options to run this application: locally with Node.js or with Docker.

### Option 1: Local Development (Requires Node.js & a PostgreSQL instance)

**1. Install Dependencies**

You need to install the required libraries for both the frontend and the backend.

```bash
# 1. Install frontend dependencies from the root directory
npm install

# 2. Install backend dependencies from the backend directory
cd backend
npm install
cd ..
```

**2. Configure Environment**

The backend requires a connection to a PostgreSQL database.

First, copy the example environment file to a new `.env` file:
```bash
# From the project root, run:
cp backend/.env.example backend/.env
```
Next, open `backend/.env` in your editor and update the `DATABASE_URL` with your actual database connection string.

**3. Run The Application**

You must have two separate terminal windows open to run both parts of the application simultaneously.

**Terminal 1: Start the Backend Server**
```bash
cd backend
node server.js
```
> Leave this terminal running. You should see "Server listening on port 8080" and messages about the database connection.

**Terminal 2: Start the Frontend UI**
```bash
# Make sure you are in the project's root folder
npm start
```
> Your browser will open to `http://localhost:3000`. The application is now fully operational.

---

### Option 2: Run with Docker (Easiest)

If you have Docker Desktop installed, you can launch the entire application stack (frontend, backend, and database) with a single command from the project root.

```bash
# Build and start all services
docker-compose up --build
```
> After the build process completes, the application will be available at `http://localhost`.

To stop the application, press `Ctrl + C` in the terminal and then run:
```bash
docker-compose down
```