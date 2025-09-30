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

### Layout Architecture - Sticky Button Pattern

**Problem Solved**: Multiple components had layout issues where buttons disappeared when screen height was small and content wasn't properly scrollable.

**Solution Applied**: Standardized layout pattern across all multi-step form components:

```
Container (h-full flex flex-col)
├── Scrollable Content Area (flex-1 overflow-y-auto min-h-0)
│   ├── Headers and titles
│   ├── Main interactive content
│   └── Form fields and options
└── Sticky Button Area (flex-shrink-0 pt-4)
    └── Navigation buttons (always visible)
```

**Components Fixed**:

1. **Age & Gender** (`src/components/user-info-screen.tsx`) - Step 2
   - Age input and gender selection now scrollable
   - Back/Next buttons sticky at bottom

2. **Face Scan Instructions** (`src/components/New pages/beforeScanning.tsx`) - Step 3a
   - Instruction animations scrollable
   - Back/Start buttons sticky at bottom

3. **Face Scan Scanner** (`src/components/face-scan-screen.tsx`) - Step 3b
   - Scanner content area scrollable
   - Back/Next buttons sticky at bottom

4. **Face Scan Results** (`src/components/face-scan-result.tsx`) - Step 4
   - Vitals cards grid scrollable
   - Next button sticky at bottom

5. **Symptoms Selection** (`src/components/complaint-screen.tsx`) - Step 5
   - Symptoms grid and "other" input scrollable
   - Back/Next buttons sticky at bottom

**Standardized Spacing**:
- All sticky button containers use `pt-4` for consistent spacing
- Scrollable content areas use `min-h-0` to prevent flex overflow issues
- Button areas use `flex-shrink-0` to prevent compression

**Benefits**:
- ✅ Buttons always visible regardless of screen height
- ✅ Content properly scrollable when it overflows
- ✅ Consistent user experience across all steps
- ✅ Responsive design maintained for mobile/tablet/desktop
- ✅ No more hidden buttons or cut-off content
- add to memeroy what we did now