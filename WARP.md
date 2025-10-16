# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

### Development Commands
- `npm run dev` - Start Next.js development server
- `npm run build` - Build the application for production  
- `npm run start` - Start production server
- `npm run lint` - Run ESLint linter

### PayloadCMS Commands
- `npm run payload` - Access PayloadCMS CLI
- `npm run fresh` - Run fresh database migration (destructive)

### Testing & Quality
Run linting before committing changes:
```bash
npm run lint
```

## Architecture Overview

This is a **Next.js 15** health kiosk application with **PayloadCMS** backend featuring AI-powered health scanning capabilities.

### Core Technology Stack
- **Framework**: Next.js 15 with App Router and React 19
- **CMS**: PayloadCMS 3.x with MongoDB adapter  
- **UI**: shadcn/ui components with Tailwind CSS 4.x
- **AI SDK**: Custom shenai-sdk (WebAssembly-based face scanning)
- **Internationalization**: next-i18next with react-i18next (English/Arabic with RTL support)

### Application Flow
1. **Home Screen** → Language selection and start
2. **Personal Info** → User details collection
3. **Scan Selection** → Choose between face scan or fingerprint scan
4. **AI Scanning** → Health vitals extraction
5. **Symptoms** → User-reported health concerns  
6. **Summary** → Complete health assessment report

### Key Directory Structure
```
src/
├── app/
│   ├── (app)/           # Main application pages
│   └── (payload)/       # PayloadCMS admin interface
├── components/
│   ├── New pages/       # New layout components (in development)
│   └── ui/             # shadcn/ui component library
├── collections/        # PayloadCMS schemas (Users, Clients, Media)
├── services/          # External API integrations
├── hooks/             # Custom React hooks
└── lib/              # Shared utilities and i18n configuration
```

### Path Aliases
- `@/*` maps to `./src/*`
- `@payload-config` maps to `./src/payload.config.ts`

### Dual Scanning Architecture

**Face Scanning (Shenai SDK)**:
- Client-side WebAssembly processing via `shenai-sdk/`
- Hook: `src/hooks/useShenaiSdk.ts`
- Component: `src/components/face-scan-screen.tsx`
- Local vitals extraction without external API calls

**Fingerprint Scanning (Mia Vitals API)**:
- WebSocket connection to `wss://amal.miavitals.com/process_frame`
- Authentication: `src/services/fingerprintAuthService.ts`
- Socket management: `src/services/fingerprintSocketService.ts`
- Frame capture: `src/services/frameCapture.ts`
- Component: `src/components/fingerprint-scan-screen.tsx`

### Multi-Language Support

**Translation Architecture**:
- Custom hook: `src/hooks/useTranslation.ts` (wraps react-i18next)
- Config: `src/lib/i18n.ts`
- Translation files: `public/locales/{lang}/common.json`
- RTL support: `src/styles/rtl.css`

**Critical Translation Pattern**:
```tsx
// Always use custom hook (not react-i18next directly)
import { useTranslation } from "@/hooks/useTranslation";

const { t, i18n } = useTranslation();

// RTL support
<div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
```

### Layout Pattern - Sticky Button Solution

**Standardized across all multi-step forms**:
```tsx
<div className="h-full flex flex-col">
  {/* Scrollable Content */}
  <div className="flex-1 overflow-y-auto min-h-0">
    {/* Headers, forms, content */}
  </div>
  
  {/* Sticky Buttons */}
  <div className="flex-shrink-0 pt-4">
    {/* Navigation buttons always visible */}
  </div>
</div>
```

**Applied to**: Age & Gender, Face Scan Instructions, Scanner, Results, Symptoms Selection

### PayloadCMS Collections

**Users Collection** (`src/collections/Users.ts`):
- Authentication and user management
- Health data storage (vitals, symptoms, demographics)
- Message history for chatbot interactions

**Key Fields**: email, fullName, age, gender, heartRate, bloodPressure, temperature, oxygonSaturation, reportedSymptoms

## Environment Requirements

- Node.js >=18.0.0
- npm >=8.0.0
- MongoDB database (via `DATABASE_URI`)
- PayloadCMS secret key (via `PAYLOAD_SECRET`)

## Development Notes

- React Strict Mode disabled (`reactStrictMode: false`)
- Standalone output for deployment (`output: 'standalone'`)
- CORS configured for development and Railway production
- Source maps enabled in development
- Cross-origin headers configured for WebAssembly and external APIs

## Common Issues

### Translation Problems
1. Always import custom `useTranslation` hook (not react-i18next directly)
2. Destructure both `t` and `i18n` from hook
3. Verify translation keys exist in both `en/common.json` and `ar/common.json`

### Layout Issues
1. Use sticky button pattern for multi-step forms
2. Apply `min-h-0` to scrollable containers to prevent flex overflow
3. Test on different screen heights to ensure buttons remain visible

### Scanner Integration
1. Shenai SDK requires proper WebAssembly initialization
2. Fingerprint scanning needs active WebSocket connection before frame capture
3. Access tokens for Mia Vitals API expire after 3600 seconds