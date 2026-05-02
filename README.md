# Weather Dashboard

A web application that provides real-time weather updates for any city in the world. Users can search for a city, view current weather conditions, and save favourite cities for quick access.

## Features

- Search weather by city name with autocomplete suggestions
- Displays temperature (°C), humidity, wind speed, and weather description
- Save and remove favourite cities (persisted in PostgreSQL)
- Fully responsive — works on desktop, tablet, and mobile

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | HTML, CSS, JavaScript (vanilla)   |
| Backend  | Node.js v24 + Express v5          |
| Database | PostgreSQL 15                     |
| API      | OpenWeatherMap (current weather)  |

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [PostgreSQL](https://www.postgresql.org/) 15 (via Homebrew or local install)
- An [OpenWeatherMap](https://openweathermap.org/api) free API key

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd WeatherDashboard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```
WEATHER_API_KEY=your_openweathermap_api_key

PGHOST=localhost
PGPORT=5432
PGDATABASE=weather_app
PGUSER=postgres
PGPASSWORD=your_postgres_password
```

### 4. Set up the database

Connect to PostgreSQL and run the following:

```sql
CREATE DATABASE weather_app;

\c weather_app

CREATE TABLE favorites (
  id   SERIAL PRIMARY KEY,
  city VARCHAR(255) UNIQUE NOT NULL
);
```

Or run it from the terminal in one step:

```bash
psql -U postgres -c "CREATE DATABASE weather_app;"
psql -U postgres -d weather_app -c "CREATE TABLE favorites (id SERIAL PRIMARY KEY, city VARCHAR(255) UNIQUE NOT NULL);"
```

## Running the Application

```bash
npm start
```

The server starts on [http://localhost:3000](http://localhost:3000).

Open that URL in your browser to use the application.

## Project Structure

```
WeatherDashboard/
├── server.js          # Express backend — API routes and DB connection
├── package.json       # Project metadata and dependencies
├── .env               # Environment variables (not committed to Git)
├── .env.example       # Example environment variables template
└── public/
    ├── index.html     # Main HTML page
    ├── script.js      # Frontend JavaScript (search, autocomplete, favourites)
    ├── style.css      # Responsive dark-theme styles
    └── cities.json    # City name dataset for autocomplete
```

## API Endpoints

| Method | Endpoint            | Description                        |
|--------|---------------------|------------------------------------|
| GET    | `/weather/:city`    | Fetch current weather for a city   |
| GET    | `/favorites`        | Get all saved favourite cities     |
| POST   | `/favorites`        | Add a city to favourites           |
| DELETE | `/favorites/:city`  | Remove a city from favourites      |

## Author

Muhammad Saad Bin Khurram (10220341) — DLBCSPJWD01
