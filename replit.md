# GitHub Blog PR Automation Dashboard

## Overview

This application is an automated GitHub Pull Request (PR) management system designed specifically for blog workflows. It monitors PRs with a configurable branch prefix (default: "blog/"), automatically merges them into a staging branch for review, and then promotes them to the main/production branch. The system runs on a configurable cron schedule and provides a web dashboard for monitoring, configuration, and manual triggering.

The application serves as a continuous deployment pipeline for blog content, reducing manual intervention by automating the merge workflow while maintaining visibility through detailed activity logs and status tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, built using Vite for fast development and optimized production builds.

**UI Component System**: shadcn/ui components based on Radix UI primitives, styled with Tailwind CSS. The design follows a "Design System-Based (Utility-Focused)" approach inspired by GitHub's interface patterns and Linear's clean aesthetic for developer tools.

**State Management**: TanStack Query (React Query) for server state management with automatic refetching, caching, and synchronization. No global state management library is used - component state and server state are sufficient for this application's needs.

**Routing**: Wouter for lightweight, hook-based routing with four main pages:
- Dashboard (/) - Overview and quick actions
- Activity Logs (/logs) - Detailed merge history
- Scheduler (/scheduler) - Cron schedule visualization
- Configuration (/config) - System settings

**Design Tokens**: Custom Tailwind configuration with CSS variables for theming, supporting light/dark modes. Typography uses Inter for UI elements and JetBrains Mono for code/technical content.

### Backend Architecture

**Server Framework**: Express.js with TypeScript running in ESM mode.

**API Structure**: RESTful API with the following endpoints:
- GET /api/status - Automation state and scheduling info
- GET /api/logs - Retrieve merge logs
- DELETE /api/logs - Clear all logs
- GET /api/config - Retrieve configuration
- POST /api/config - Update configuration
- POST /api/trigger - Manually trigger automation

**Service Layer Pattern**: 
- `automation-service.ts` - Orchestrates the PR merge workflow
- `github-service.ts` - Abstracts GitHub API operations via Octokit
- `scheduler.ts` - Manages cron-based automated runs
- `storage.ts` - Provides data persistence interface (currently in-memory implementation)

**Automation Workflow**:
1. Scan for open PRs matching the configured branch prefix
2. Verify PR is mergeable and targets the staging branch
3. Merge PR to staging branch
4. Check if staging-to-main PR exists; create if needed
5. Merge staging-to-main PR (if auto-merge enabled)
6. Log all operations with detailed status

### Data Storage Solutions

**Current Implementation**: In-memory storage via `MemStorage` class. This provides:
- Merge logs collection (Map-based)
- Configuration object
- Automation state tracking

**Database Schema Design**: The application uses Drizzle ORM with PostgreSQL schema defined in `shared/schema.ts`, indicating planned database persistence:
- Configuration table (owner, repo, branch settings, cron schedule, auto-merge flag)
- Merge logs table (timestamp, branch name, PR number, status, messages, merge flags)
- Automation state tracking

**Why In-Memory Currently**: Simplifies initial development and deployment. The storage interface (`IStorage`) abstracts the implementation, making it straightforward to swap to PostgreSQL persistence by implementing a `DbStorage` class.

### Authentication and Authorization

**GitHub Authentication**: Uses Replit Connectors system for OAuth-based GitHub authentication. The `github-service.ts` fetches access tokens dynamically:
- Checks token expiration before each request
- Retrieves fresh tokens from Replit Connectors API
- Supports both development (REPL_IDENTITY) and deployment (WEB_REPL_RENEWAL) modes

**Session Management**: Uses express-session with connect-pg-simple for PostgreSQL-backed sessions (indicated by package dependencies).

**No User Authentication**: The application assumes it runs in a trusted environment (Replit) and doesn't implement user login. Access control is handled at the infrastructure level.

### External Dependencies

**GitHub API Integration**:
- `@octokit/rest` - Official GitHub REST API client
- Operations: List PRs, merge PRs, create PRs, check mergeability
- Scopes required: repo access for reading and merging PRs

**Replit Platform Services**:
- Replit Connectors - OAuth integration for GitHub authentication
- Environment variables: `REPLIT_CONNECTORS_HOSTNAME`, `REPL_IDENTITY`, `WEB_REPL_RENEWAL`

**Database** (planned):
- Neon Serverless PostgreSQL (`@neondatabase/serverless`)
- Drizzle ORM for type-safe database queries
- Connection via `DATABASE_URL` environment variable

**Scheduling**:
- `node-cron` - Cron-based task scheduling
- `cron-parser` - Parse and calculate next run times
- Default schedule: "0 9 * * *" (9 AM daily)

**Development Tools**:
- Vite plugins for Replit integration (cartographer, dev banner, runtime error overlay)
- TypeScript for type safety across frontend, backend, and shared schemas
- Zod for runtime schema validation and type inference

**Design System Dependencies**:
- Radix UI primitives for accessible, unstyled components
- Tailwind CSS for utility-first styling
- class-variance-authority (CVA) for component variants
- lucide-react for consistent iconography