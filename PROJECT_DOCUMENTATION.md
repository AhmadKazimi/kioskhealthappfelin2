# Health Kiosk Application - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Project Structure](#project-structure)
4. [Data Management & Storage](#data-management--storage)
5. [API Endpoints & Routes](#api-endpoints--routes)
6. [SDK Integration (Shenai-SDK)](#sdk-integration-shenai-sdk)
7. [Component Architecture](#component-architecture)
8. [Internationalization System](#internationalization-system)
9. [Development Workflow](#development-workflow)
10. [Environment Setup & Configuration](#environment-setup--configuration)
11. [Deployment & Production](#deployment--production)

---

## Project Overview

**Health Kiosk Application** is a comprehensive health assessment kiosk built with Next.js 15 and React 19. It provides AI-powered health scanning capabilities through face analysis, collecting vital signs and health metrics from users in a kiosk environment.

### Key Features
- **AI-Powered Health Scanning**: Face-based vital sign detection using custom Shenai SDK
- **Multi-Language Support**: English and Arabic with RTL layout support
- **Health Data Management**: Complete health profile creation and storage
- **Admin Dashboard**: PayloadCMS-powered admin panel for user and client management
- **Responsive Design**: Optimized for kiosk displays and various screen sizes
- **Real-time Data Processing**: Client-side AI processing with WebAssembly

---

## Architecture & Technology Stack

### Core Technologies
- **Frontend Framework**: Next.js 15 with App Router
- **React Version**: React 19
- **UI Library**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS 4.x
- **Content Management**: PayloadCMS 3.x
- **Database**: MongoDB with Mongoose adapter
- **AI Processing**: Custom Shenai-SDK with WebAssembly
- **Internationalization**: react-i18next with next-i18next
- **State Management**: React hooks and context
- **TypeScript**: Full TypeScript implementation

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint with Next.js configuration
- **Build Tool**: Next.js built-in webpack configuration
- **Source Maps**: Enabled in development mode
- **CORS**: Configured for development and production environments

---

## Project Structure

```
kioskhealthappfelin/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (app)/                    # Main application routes
│   │   │   ├── fast-scan/            # Fast health scan page
│   │   │   ├── health-summary/       # Health results display
│   │   │   ├── home/                 # Home/welcome page
│   │   │   └── layout.tsx            # App layout wrapper
│   │   ├── (payload)/                # PayloadCMS admin routes
│   │   │   └── api/                  # Payload API endpoints
│   │   │       ├── [...slug]/        # Dynamic Payload routes
│   │   │       ├── graphql/          # GraphQL endpoint
│   │   │       └── graphql-playground/ # GraphQL playground
│   │   ├── my-route/                 # Custom API route example
│   │   │   └── route.ts              # GET endpoint for users
│   │   └── globals.css               # Global styles
│   ├── collections/                  # PayloadCMS data schemas
│   │   ├── Users.ts                  # User collection schema
│   │   ├── Clients.ts                # Client collection schema
│   │   └── Media.ts                  # Media collection schema
│   ├── components/                   # React components
│   │   ├── New pages/                # Updated component versions
│   │   ├── ui/                       # shadcn/ui component library
│   │   ├── face-scan-screen.tsx      # Main scanning interface
│   │   ├── ShenaiScanner.tsx         # SDK integration component
│   │   ├── language-switcher.tsx     # Language switching UI
│   │   └── i18n-provider.tsx         # Internationalization provider
│   ├── hooks/                        # Custom React hooks
│   │   ├── useShenaiSdk.ts           # SDK initialization hook
│   │   ├── useTranslation.ts         # Custom i18n hook
│   │   ├── useHydrationSafe.ts       # SSR safety hook
│   │   └── useDarkMode.ts            # Theme switching hook
│   ├── lib/                          # Utility libraries
│   │   ├── i18n.ts                   # i18n configuration
│   │   ├── utils.ts                  # General utilities
│   │   └── helpers.ts                # Helper functions
│   ├── types/                        # TypeScript type definitions
│   ├── payload.config.ts             # PayloadCMS configuration
│   ├── payload-types.ts              # Auto-generated Payload types
│   └── middleware.ts                 # Next.js middleware
├── shenai-sdk/                       # Custom AI SDK
│   ├── package.json                  # SDK package configuration
│   ├── index.d.ts                    # TypeScript definitions
│   ├── index.mjs                     # Main SDK module
│   ├── shenai_sdk.wasm              # WebAssembly binary
│   └── util/                         # SDK utilities
├── public/
│   ├── locales/                      # Translation files
│   │   ├── en/common.json            # English translations
│   │   └── ar/common.json            # Arabic translations
│   └── shenai-sdk/                   # Public SDK assets
└── components/                       # Legacy component directory
```

---

## Data Management & Storage

### Database Architecture (MongoDB)

#### Collections Overview

**1. Users Collection** (`src/collections/Users.ts`)
```typescript
interface User {
  id: string
  username: string          // Required - user identifier
  email: string             // Required, unique - user email
  fullName?: string         // Optional - display name
  healthConcern?: string    // Optional - primary health concern
  messages?: Array<{        // Optional - chat/message history
    message: string
  }>
  phone?: string           // Optional - contact number
  date?: string            // Optional - registration/visit date
  time?: string            // Optional - visit time
  age?: string             // Optional - user age
  gender?: string          // Optional - user gender
  
  // Health Vitals (collected via AI scan)
  heartRate?: string       // BPM measurement
  bloodPressure?: string   // Systolic/Diastolic reading
  temperature?: string     // Body temperature
  oxygonSaturation?: string // O2 saturation percentage
  reportedsymptoms?: string // User-reported symptoms
}
```

**2. Clients Collection** (`src/collections/Clients.ts`)
- Identical schema to Users collection
- Used for client/customer data management
- Separate from administrative users

**3. Media Collection** (`src/collections/Media.ts`)
- Handles file uploads (images, documents)
- Integrated with PayloadCMS media management

### Data Access Patterns

```typescript
// Payload API Usage Example
const payload = await getPayload({ config: configPromise })

// Create user with health data
const user = await payload.create({
  collection: 'users',
  data: {
    username: 'john_doe',
    email: 'john@example.com',
    heartRate: '72',
    bloodPressure: '120/80',
    temperature: '98.6',
    oxygonSaturation: '98'
  }
})

// Query users with filters
const users = await payload.find({
  collection: 'users',
  where: {
    heartRate: {
      greater_than: '80'
    }
  }
})
```

---

## API Endpoints & Routes

### PayloadCMS Auto-Generated Endpoints

**Base URL**: `/api`

#### User Management
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get specific user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

#### Client Management  
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create new client
- `GET /api/clients/:id` - Get specific client
- `PATCH /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

#### Media Management
- `GET /api/media` - List media files
- `POST /api/media` - Upload media file
- `GET /api/media/:id` - Get specific media file

#### GraphQL Endpoint
- `POST /api/graphql` - GraphQL queries and mutations
- `GET /api/graphql-playground` - Interactive GraphQL explorer

### Custom API Routes

**Example Route**: `src/app/my-route/route.ts`
```typescript
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const GET = async () => {
  const payload = await getPayload({
    config: configPromise,
  })

  const data = await payload.find({
    collection: 'users',
  })

  return Response.json(data)
}
```

### Request/Response Examples

**Create User with Health Data**:
```bash
POST /api/users
Content-Type: application/json

{
  "username": "patient_001",
  "email": "patient@example.com", 
  "fullName": "John Doe",
  "age": "35",
  "gender": "male",
  "heartRate": "72",
  "bloodPressure": "120/80",
  "temperature": "98.6",
  "oxygonSaturation": "98",
  "healthConcern": "Regular checkup"
}
```

**Response**:
```json
{
  "message": "User created successfully",
  "doc": {
    "id": "6507f1f9c1234567890abcde",
    "username": "patient_001",
    "email": "patient@example.com",
    "createdAt": "2023-09-18T10:30:00.000Z",
    "updatedAt": "2023-09-18T10:30:00.000Z"
  }
}
```

---

## SDK Integration (Shenai-SDK)

### Overview
The **Shenai-SDK** is a custom WebAssembly-based AI SDK for health scanning through facial analysis. It processes video feed in real-time to extract vital signs.

### SDK Structure
```
shenai-sdk/
├── package.json          # SDK metadata (v2.7.0)
├── index.d.ts           # TypeScript definitions
├── index.mjs            # Main module entry point
├── shenai_sdk.wasm      # WebAssembly binary (AI processing)
├── shenai_sdk.worker.js # Web Worker for background processing
└── util/                # SDK utilities and helpers
```

### Integration Hook (`src/hooks/useShenaiSdk.ts`)

```typescript
import { useRef, useState } from "react";
import { ShenaiSDK } from "shenai-sdk";

export const useShenaiSdk = () => {
  const [shenaiSdk, setShenaiSdk] = useState<ShenaiSDK>();
  const sdkRef = useRef<ShenaiSDK | null | undefined>(undefined);

  // SDK initialization logic
  if (sdkRef.current === undefined && typeof window !== "undefined") {
    sdkRef.current = null;
    
    // Dynamic import for client-side only
    import("shenai-sdk")
      .then((sdk) => sdk.default({
        onRuntimeInitialized: () => {
          console.log("Shen.AI Runtime initialized");
        },
      }))
      .then((sdk) => {
        sdkRef.current = sdk;
        setShenaiSdk(sdk);
      })
      .catch((error) => {
        console.error("Failed to import Shen.AI SDK:", error);
      });
  }

  return shenaiSdk;
};
```

### SDK Usage in Components

```typescript
// In face-scan-screen.tsx
import { useShenaiSdk } from "@/hooks/useShenaiSdk";

const FaceScanScreen = () => {
  const shenaiSdk = useShenaiSdk();
  
  useEffect(() => {
    if (shenaiSdk) {
      // Initialize scanning
      shenaiSdk.startScanning({
        onVitalsDetected: (vitals) => {
          setVitalsData({
            heartRate: vitals.heartRate,
            bloodPressure: vitals.bloodPressure,
            temperature: vitals.temperature,
            oxygenSaturation: vitals.oxygenSaturation
          });
        }
      });
    }
  }, [shenaiSdk]);
};
```

### Health Data Flow
1. **Video Capture**: Browser accesses user camera
2. **Frame Processing**: SDK processes video frames in WebAssembly
3. **AI Analysis**: Facial analysis extracts vital signs
4. **Data Extraction**: Heart rate, blood pressure, temperature, O2 saturation
5. **Real-time Updates**: Components receive live health metrics
6. **Database Storage**: Final results saved to MongoDB via Payload API

---

## Component Architecture

### Core Components

#### 1. Face Scan Screen (`face-scan-screen.tsx`)
```typescript
interface FaceScanScreenProps { 
  onPrev: () => void
  onNext: () => void
} 

interface VitalsData {
  heartRate: number
  bloodPressure: string
  temperature: number
  oxygenSaturation: number
}
```

**Features**:
- Real-time face scanning interface
- Countdown timer for scan duration
- Vital signs display and results
- Multi-language support
- Responsive design for kiosk displays

#### 2. Shenai Scanner Component (`ShenaiScanner.tsx`)
- Wraps SDK functionality
- Manages camera access and permissions
- Handles real-time video processing
- Provides scanning status updates

#### 3. Language Switcher (`language-switcher.tsx`)
- Toggle between English and Arabic
- Persists language preference
- Triggers layout changes for RTL support

### UI Component Library (`src/components/ui/`)

Based on **shadcn/ui** with Radix UI primitives:
- `Button` - Interactive buttons with variants
- `Card` - Content containers
- `Dialog` - Modal dialogs
- `Form` - Form handling with validation
- `Input` - Form input fields
- `Toast` - Notification system

### Component Patterns

```typescript
// Standard component with translation support
"use client"

import { useTranslation } from "@/hooks/useTranslation"

export const MyComponent = () => {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'
  
  return (
    <div dir={isArabic ? 'rtl' : 'ltr'}>
      <h1>{t('section.title')}</h1>
      <p className={isArabic ? 'text-right' : 'text-left'}>
        {t('section.content')}
      </p>
    </div>
  )
}
```

---

## Internationalization System

### Configuration (`src/lib/i18n.ts`)
```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: ['en', 'ar'],
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    resources: {
      en: { common: require('../../public/locales/en/common.json') },
      ar: { common: require('../../public/locales/ar/common.json') }
    }
  })
```

### Translation Files Structure

**English** (`public/locales/en/common.json`):
```json
{
  "welcome": {
    "title": "Welcome to Health Check",
    "subtitle": "Your AI-powered health assessment"
  },
  "faceScan": {
    "title": "Face Scan",
    "instruction": "Look directly at the camera",
    "scanComplete": "Scan Complete",
    "heartRate": "Heart Rate",
    "bloodPressure": "Blood Pressure"
  },
  "buttons": {
    "back": "Back",
    "next": "Next",
    "loading": "Loading...",
    "startScan": "Start Scan"
  }
}
```

**Arabic** (`public/locales/ar/common.json`):
```json
{
  "welcome": {
    "title": "مرحباً بك في فحص الصحة",
    "subtitle": "تقييم صحتك بالذكاء الاصطناعي"
  },
  "faceScan": {
    "title": "مسح الوجه",
    "instruction": "انظر مباشرة إلى الكاميرا",
    "scanComplete": "اكتمل المسح",
    "heartRate": "معدل ضربات القلب",
    "bloodPressure": "ضغط الدم"
  },
  "buttons": {
    "back": "رجوع",
    "next": "التالي",
    "loading": "جاري التحميل...",
    "startScan": "ابدأ المسح"
  }
}
```

### Custom Translation Hook

```typescript
// src/hooks/useTranslation.ts
import { useTranslation as useI18nTranslation } from 'react-i18next'

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation('common')
  
  return {
    t,
    i18n,
    changeLanguage: (lang: string) => i18n.changeLanguage(lang),
    currentLanguage: i18n.language,
    isArabic: i18n.language === 'ar'
  }
}
```

### RTL Support

**CSS** (`src/styles/rtl.css`):
```css
[dir="rtl"] .rtl\:text-right {
  text-align: right;
}

[dir="rtl"] .rtl\:flex-row-reverse {
  flex-direction: row-reverse;
}

[dir="rtl"] .rtl\:space-x-reverse > :not([hidden]) ~ :not([hidden]) {
  margin-left: 0.5rem;
  margin-right: 0;
}
```

---

## Development Workflow

### Setup Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production  
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

### PayloadCMS Commands
```bash
# Access Payload CLI
npm run payload

# Fresh database migration (destructive)
npm run fresh

# Generate types
npm run payload generate:types
```

### Development Process

1. **Component Development**:
   - Create components in `src/components/`
   - Use TypeScript for type safety
   - Implement translation support with `useTranslation`
   - Follow responsive design patterns

2. **API Development**:
   - Define collections in `src/collections/`
   - Use Payload's built-in API endpoints
   - Create custom routes in `src/app/*/route.ts`

3. **SDK Integration**:
   - Use `useShenaiSdk` hook for AI functionality
   - Handle async SDK initialization
   - Process real-time health data

4. **Testing**:
   - Test multi-language functionality
   - Verify RTL layout for Arabic
   - Test SDK integration and health scanning
   - Validate responsive design

---

## Environment Setup & Configuration

### Environment Variables

**.env.development**:
```bash
# Database
DATABASE_URI=mongodb://localhost:27017/health-kiosk

# PayloadCMS
PAYLOAD_SECRET=your-secret-key-here

# Next.js
NODE_ENV=development
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

**.env.production**:
```bash
# Database  
DATABASE_URI=mongodb+srv://user:password@cluster.mongodb.net/health-kiosk

# PayloadCMS
PAYLOAD_SECRET=production-secret-key

# Next.js
NODE_ENV=production
NEXT_PUBLIC_SERVER_URL=https://kiosk-health-app.azurewebsites.net
```

### Next.js Configuration (`next.config.ts`)

```typescript
const nextConfig: NextConfig = {
  reactStrictMode: false,           // Disabled for SDK compatibility
  output: 'standalone',             // For containerized deployment
  
  // CORS headers for API access
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        {
          key: "Access-Control-Allow-Origin",
          value: process.env.NODE_ENV === 'production' 
            ? "https://kiosk-health-app.azurewebsites.net" 
            : "*",
        },
        {
          key: "Access-Control-Allow-Methods",
          value: "GET, POST, PUT, DELETE, OPTIONS",
        }
      ],
    }];
  },
  
  // Development source maps
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = "source-map";
    }
    return config;
  },
};

export default withPayload(nextConfig);
```

### TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "strict": true,
    "paths": {
      "@/*": ["./src/*"],
      "@payload-config": ["./src/payload.config.ts"]
    }
  }
}
```

---

## Deployment & Production

### Build Process
```bash
# Install production dependencies
npm ci

# Build application
npm run build

# Generate Payload types
npm run payload generate:types
```

### Azure Deployment
- Uses standalone output mode
- Configured with proper CORS headers
- Environment variables managed through Azure App Service
- Static assets served from public directory

### Production Considerations

1. **Database**: MongoDB Atlas for production database
2. **Environment**: Secure environment variable management
3. **CORS**: Production-specific CORS configuration
4. **SSL**: HTTPS enforcement for secure data transmission
5. **Monitoring**: Application insights and logging
6. **Scaling**: Horizontal scaling for high traffic

### Performance Optimization

- **WebAssembly**: Client-side AI processing reduces server load
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic code splitting for faster loads
- **Caching**: Browser and CDN caching strategies
- **Bundle Analysis**: Regular bundle size monitoring

---

## Data Flow Summary

1. **User Interaction**: User starts health scan on kiosk
2. **SDK Initialization**: Shenai-SDK loads WebAssembly components
3. **Camera Access**: Browser requests camera permissions
4. **AI Processing**: Real-time facial analysis extracts vital signs
5. **Data Validation**: Health metrics validated and formatted
6. **API Storage**: Data sent to PayloadCMS API endpoints
7. **Database Persistence**: MongoDB stores user health records
8. **Results Display**: Health summary shown to user
9. **Admin Access**: Health data accessible via admin dashboard

This comprehensive documentation covers the complete architecture, data flow, and integration patterns of the Health Kiosk Application.