# AgriFleet Frontend

The AgriFleet frontend is a Next.js dashboard for an intelligent agricultural logistics decision-support system. It provides a single interface for managing farmers, bookings, vehicles, routes, resource allocation, network analysis, and multi-job tour optimization.

## Features

- Operations dashboard with live fleet and booking summaries
- Farmer booking portal for creating, updating, and deleting bookings
- Vehicle management and fleet status updates
- A\* and Dijkstra route optimization with route caching
- Hungarian batch allocation and real-time greedy allocation
- Road-network analysis, bridges, minimum spanning tree, cuts, and weight checks
- TOPSIS vehicle or candidate ranking and harvest-delay prediction
- Farm selection and multi-job tour optimization
- Interactive Leaflet and MapLibre map views

## Technology

- Next.js `16.3.3` with the App Router
- React `19.2.8`
- Tailwind CSS `4`
- Axios for backend communication
- Leaflet, React Leaflet, MapLibre GL, and Google Maps integrations
- Recharts for data visualization

## Prerequisites

- Node.js with npm
- The AgriFleet backend services running locally, unless the API URLs are configured for another environment

## Installation

From this directory:

```bash
npm install
```

Create a `.env.local` file when the backend services are not using their default local URLs. All variables are optional:

```env
NEXT_PUBLIC_CORE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_ROUTING_URL=http://localhost:8081/api/v1
NEXT_PUBLIC_ALLOCATION_URL=http://localhost:8082/api/v1
NEXT_PUBLIC_NETWORK_URL=http://localhost:8083/api/v1
NEXT_PUBLIC_DECISION_URL=http://localhost:8084/api/v1
NEXT_PUBLIC_TOUR_URL=http://localhost:8085/api/v1
```

The frontend reads these values in `src/services/api.js`. If a variable is omitted, its listed default is used.

## Running Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Available screens:

| Path                 | Purpose                              |
| -------------------- | ------------------------------------ |
| `/`                  | Operations dashboard                 |
| `/farmer`            | Farmer bookings                      |
| `/vehicles`          | Vehicle management                   |
| `/routing`           | Route optimization                   |
| `/allocation`        | Resource allocation                  |
| `/network`           | Network analysis                     |
| `/decision-support`  | Decision support and predictions     |
| `/tour-optimization` | Farm selection and tour optimization |

## Scripts

```bash
npm run dev       # Start the development server
npm run lint      # Run ESLint
npm run build     # Create a production build
npm run start     # Serve the production build
```

For a production run:

```bash
npm run build
npm run start
```

## Project Structure

```text
src/
  app/              App Router pages and feature screens
  components/       Shared UI and map components
  context/          Shared React context
  services/api.js   Centralized Axios clients and API methods
public/             Static assets
```

Each backend service has its own Axios client in `src/services/api.js`. Keep feature-specific API calls in that service layer rather than creating clients directly in page components.

## Troubleshooting

- A browser network error usually means the corresponding backend service is not running or its `NEXT_PUBLIC_*_URL` value is incorrect.
- After changing `.env.local`, restart `npm run dev` so Next.js reloads the public environment variables.
- Map tiles require network access to the configured map provider.
