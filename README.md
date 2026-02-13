# SMB Services Intelligence Platform

A web application for analyzing and comparing broadband, mobile, and business services from major North American providers. Features on-demand data refresh, head-to-head comparisons, and comprehensive matrix views with full citation tracking.

## Features

- **Provider Coverage**: Comcast Business (deep coverage), AT&T Business, Verizon Business, T-Mobile for Business, Spectrum Business, Cox Business, and more MSOs
- **On-Demand Refresh**: Fetch latest offers and pricing when you need them
- **Matrix Comparison**: Compare multiple providers with customizable columns and filters
- **Head-to-Head**: Deep dive comparisons between specific providers
- **Citation Tracking**: Every data point links back to its source
- **BYO LLM**: Bring your own API key (OpenAI, Anthropic, Gemini, or OpenAI-compatible endpoints)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js v5 with database sessions
- **UI**: Tailwind CSS + Radix UI components
- **Containerization**: Docker + Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for local development without Docker)

### Running with Docker (Recommended)

1. Clone the repository and navigate to the project directory:

```bash
cd MobileCompetition
```

2. Copy the example environment file:

```bash
cp .env.example .env
```

3. Start the application:

```bash
docker-compose up --build
```

4. The application will be available at [http://localhost:3000](http://localhost:3000)

5. The database will be automatically initialized with the schema

### Running Locally (Development)

1. Install dependencies:

```bash
npm install
```

2. Set up your `.env` file with a local PostgreSQL connection:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/smb_intelligence?schema=public"
AUTH_SECRET="your-secret-key"
ENCRYPTION_KEY="your-64-char-hex-key"
```

3. Generate Prisma client and push schema:

```bash
npm run db:generate
npm run db:push
```

4. Start the development server:

```bash
npm run dev
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `AUTH_SECRET` | Secret key for NextAuth session encryption | Yes |
| `AUTH_URL` | Base URL of your application | Yes |
| `ENCRYPTION_KEY` | 64-character hex key for encrypting API keys | Yes |

### Generating an Encryption Key

```bash
openssl rand -hex 32
```

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (app)/             # Protected app pages
│   └── api/               # API routes
├── components/            # React components
│   └── ui/               # UI primitives (shadcn/ui style)
├── lib/                   # Shared utilities
├── prisma/               # Database schema and migrations
├── src/
│   ├── collectors/       # Provider data collectors
│   ├── llm/             # LLM client wrappers
│   └── security/        # Encryption utilities
├── Dockerfile
└── docker-compose.yml
```

## Provider Coverage

### Initial MVP Providers

| Provider | Type | Deep Coverage |
|----------|------|---------------|
| Comcast Business | MSO | Yes |
| Spectrum Business | MSO | No |
| Cox Business | MSO | No |
| Optimum Business | MSO | No |
| AT&T Business | Telco | No |
| Verizon Business | Telco | No |
| T-Mobile for Business | Wireless | No |

## License

Proprietary - All rights reserved
