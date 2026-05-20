# Resource Desk Pro

Unified space scheduling and management portal.

## Overview

Resource Desk Pro is a comprehensive physical resource management system designed to handle scheduling, allocations, and maintenance for organizational assets and spaces. It features tailored workspaces for different roles:

- **Admin Console**: Approve requests, manage platform settings, assign roles, and audit access logs.
- **Operations Workspace**: Review request queues, coordinate resource inventory, and release active allocations.
- **Member Hub**: Browse the catalog of physical resources, check booking logs, and request scheduling times.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS with dark/light mode support
- **State Management**: React Query (TanStack Query)
- **Database / ORM**: Prisma with PostgreSQL (via Supabase)
- **Authentication**: NextAuth.js
- **UI Components**: shadcn/ui components (Radix UI + Tailwind)
- **Icons**: Lucide React

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in a `.env` file (Database URL, NextAuth secret, etc.)
4. Run database migrations:
   ```bash
   npx prisma db push
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
