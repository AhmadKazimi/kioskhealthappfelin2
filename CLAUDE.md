# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands
- `npm run dev` - Start Next.js development server
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint linter

### Payload CMS Commands
- `npm run payload` - Access Payload CMS CLI
- `npm run fresh` - Run fresh database migration (destructive)

## Architecture

This is a **Next.js 15** application with **PayloadCMS** as the headless CMS and **React 19** for the frontend. The project is a health kiosk application with AI-powered scanning capabilities.

### Key Technologies
- **Framework**: Next.js 15 with App Router
- **CMS**: PayloadCMS 3.x with MongoDB adapter
- **UI**: shadcn/ui components with Tailwind CSS 4.x
- **State Management**: React hooks and context
- **AI SDK**: Custom shenai-sdk for health scanning
- **Internationalization**: next-i18next with react-i18next
- **Authentication**: PayloadCMS built-in auth

### Project Structure
- **App Routes**: `src/app/(app)/` - Main application pages
- **Admin Routes**: `src/app/(payload)/` - PayloadCMS admin interface
- **Components**: `src/components/` - Reusable React components
  - `src/components/New pages/` - New layout components being developed
  - `src/components/ui/` - shadcn/ui component library
- **Collections**: `src/collections/` - PayloadCMS data schemas (Users, Clients, Media)
- **Hooks**: `src/hooks/` - Custom React hooks including `useShenaiSdk`
- **Types**: `src/types/` - TypeScript definitions
- **Config**: `src/payload.config.ts` - PayloadCMS configuration

### Key Features
- Health scanning with AI analysis via shenai-sdk
- Multi-language support (i18next)
- Admin panel for user and client management
- Responsive UI with theme support
- Azure deployment ready

### Path Aliases
- `@/*` maps to `./src/*`
- `@payload-config` maps to `./src/payload.config.ts`

### Environment Requirements
- Node.js >=18.0.0
- npm >=8.0.0
- MongoDB database (via `DATABASE_URI`)
- PayloadCMS secret key (via `PAYLOAD_SECRET`)

### Development Notes
- React Strict Mode is disabled (`reactStrictMode: false`)
- CORS configured for development and production environments
- Source maps enabled in development
- Uses standalone output for deployment
- qasdadas