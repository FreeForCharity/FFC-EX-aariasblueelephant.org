# Aaria's Blue Elephant — ABE Website

A compassionate community platform for inclusive play and early intervention support.

## Tech Stack

- **React 19** + TypeScript
- **Vite 6** (build tool)
- **React Router DOM 7** (routing)
- **Supabase** (auth + database)
- **Recharts** (dashboard analytics)
- **Lucide React** (icons)

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (see Environment Setup)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

### Type Check / Lint

```bash
npm run lint
```

## Deployment

This project is configured for deployment on **Vercel**, **Netlify**, or any static host that supports SPA routing.

For Netlify, add a `_redirects` file:
```
/*  /index.html  200
```

For Vercel, add a `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

## Project Structure

```
/
├── components/     # Shared UI components
├── context/        # React context providers (Auth, Data)
├── lib/            # Third-party client setup (Supabase)
├── pages/          # Route-level page components
├── public/         # Static assets
├── constants.ts    # App-wide constants and mock data
├── types.ts        # TypeScript type definitions
└── App.tsx         # Root app with routing
```
