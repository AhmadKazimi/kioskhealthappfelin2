# Health Check - Translation Issues Resolution & Project Reference

## Project Overview

This is a React Next.js health assessment kiosk application with multi-language support (English/Arabic) featuring face scanning, health questionnaires, and comprehensive health reporting.

## Translation Issues Resolved

### Problem Summary
The `Newpersonal-info-screen.tsx` component had several translation issues causing Arabic text to display in English, particularly in loading states and button text.

### Key Issues Found & Fixed:

1. **Incorrect Import Statement (FIXED)**
   - **Problem**: Component imported `useTranslation` directly from `react-i18next` 
   - **Fix**: Changed to use custom hook `@/hooks/useTranslation`
   - **Code Change**: 
   ```tsx
   // Before:
   import { useTranslation } from "react-i18next";
   
   // After: 
   import { useTranslation } from "@/hooks/useTranslation";
   ```

2. **Missing Hook Destructuring (VERIFIED CORRECT)**
   - **Status**: Already properly implemented
   - **Code**: `const { t, i18n } = useTranslation();`

3. **Translation Keys Verification (VERIFIED COMPLETE)**
   - All button keys exist in both languages:
     - `buttons.loading`: "Loading..." / "جاري التحميل..."
     - `buttons.back`: "Back" / "رجوع"
     - `buttons.next`: "Next" / "التالي"

## Translation Architecture

### Hook Structure
- **Custom Hook**: `src/hooks/useTranslation.ts`
  - Wraps `react-i18next` with client-side initialization
  - Handles localStorage language persistence
  - Provides fallbacks for SSR compatibility

- **Configuration**: `src/lib/i18n.ts`
  - Configures `i18next` with language detection
  - Imports translation JSON files
  - Supports languages: `['en', 'ar']`

### Translation Files Location
- English: `public/locales/en/common.json`
- Arabic: `public/locales/ar/common.json`

### File Structure
```
src/
├── hooks/
│   └── useTranslation.ts        # Custom translation hook
├── lib/
│   └── i18n.ts                  # i18n configuration
├── components/
│   ├── personal-info-screen.tsx        # Working reference component
│   ├── New pages/
│   │   └── Newpersonal-info-screen.tsx # Fixed component
│   ├── language-switcher.tsx           # Language switcher UI
│   └── i18n-provider.tsx              # Provider wrapper
└── styles/
    └── rtl.css                         # RTL styles for Arabic
```

## Best Practices for Translation

### 1. Import Usage
Always use the custom hook:
```tsx
import { useTranslation } from "@/hooks/useTranslation";
```

### 2. Hook Destructuring
Always destructure both `t` and `i18n`:
```tsx
const { t, i18n } = useTranslation();
```

### 3. Translation Key Structure
Use semantic, hierarchical keys:
```json
{
  "personalInfo": {
    "title": "Personal Information",
    "errors": {
      "fullNameRequired": "Full Name is required!"
    }
  },
  "buttons": {
    "back": "Back",
    "next": "Next",
    "loading": "Loading..."
  }
}
```

### 4. RTL Support Implementation
```tsx
// Direction-aware styling
<form dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>

// Conditional classes for Arabic
<div className={`flex ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
```

### 5. Responsive Behavior
The component supports different layouts:
- **Mobile**: `md:hidden` - Compact vertical layout
- **Desktop**: `hidden lg:flex` - Horizontal grid layout
- **Breakpoints**: Tailwind responsive classes (`sm:`, `md:`, `lg:`)

### 6. Component State Management
```tsx
// Loading states with proper translation
{isLoading ? (
  <span>{t('buttons.loading')}</span>
) : (
  <span>{t('buttons.next')}</span>
)}
```

## Common Translation Keys

### Buttons
```json
"buttons": {
  "back": "Back" / "رجوع",
  "next": "Next" / "التالي", 
  "loading": "Loading..." / "جاري التحميل...",
  "continue": "Continue" / "متابعة",
  "submit": "Submit" / "إرسال"
}
```

### Personal Info Form
```json
"personalInfo": {
  "title": "Personal Information" / "المعلومات الشخصية",
  "fullName": "Full Name" / "الاسم الكامل",
  "email": "Email Address" / "البريد الإلكتروني",
  "phone": "Phone Number" / "رقم الهاتف",
  "nationality": "Nationality" / "الجنسية",
  "consent": "I consent to share..." / "أوافق على مشاركة...",
  "agreement": "I understand and agree..." / "أفهم وأوافق..."
}
```

## Troubleshooting Guide

### Loading States Show English
1. Check import statement - use custom hook
2. Verify hook destructuring includes `t` and `i18n`
3. Confirm translation keys exist in both files

### RTL Layout Issues  
1. Add `dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}` to parent containers
2. Use conditional classes for Arabic-specific styling
3. Test with Arabic language active

### Translation Keys Not Found
1. Verify key exists in both `en/common.json` and `ar/common.json`
2. Check key path matches exactly (case-sensitive)
3. Ensure no typos in key names

### Component Not Re-rendering on Language Change
1. Ensure component uses the custom `useTranslation` hook
2. Check that language switcher is properly updating `i18n.language`
3. Verify `i18n` instance is the same across components

## Testing Checklist

### Translation Testing
- [ ] All buttons translate properly (loading, next, back)
- [ ] Form labels appear in correct language
- [ ] Error messages display in selected language
- [ ] Placeholders show appropriate language text

### RTL Testing (Arabic)
- [ ] Text flows right-to-left
- [ ] Form inputs align correctly
- [ ] Buttons maintain proper spacing
- [ ] Icons and arrows mirror appropriately

### Responsive Testing
- [ ] Mobile layout works in both languages
- [ ] Desktop layout maintains proper alignment
- [ ] Text doesn't overflow containers
- [ ] Button sizing remains consistent

## Performance Considerations

1. **Bundle Size**: Translation files are imported statically, optimizing bundle splitting
2. **Client-Side Hydration**: Custom hook handles SSR/client-side differences
3. **Language Persistence**: Uses localStorage to remember user preference
4. **Lazy Loading**: Consider dynamic imports for additional languages

## Deployment Notes

1. Ensure translation files are included in build output
2. Test language switching in production environment  
3. Verify RTL styles are properly compiled
4. Check that localStorage works correctly across domains

## Maintenance

### Adding New Languages
1. Create new folder: `public/locales/{lang}/`
2. Copy and translate `common.json`
3. Add language to `supportedLngs` in `i18n.ts`
4. Update language switcher component

### Updating Translations
1. Maintain same key structure across all languages
2. Use consistent translation style and tone
3. Test all affected components after updates
4. Validate with native speakers when possible

## Architecture Decisions

### Why Custom Translation Hook?
- **SSR Compatibility**: Handles server/client hydration differences
- **Type Safety**: Can be extended with TypeScript for better DX
- **Consistent Behavior**: Ensures same initialization across app
- **Error Handling**: Provides fallbacks when translations fail

### Why Static JSON Files?
- **Performance**: Pre-built into bundle, no runtime fetching
- **Reliability**: Always available, no network dependencies  
- **Simplicity**: Easy to manage and version control
- **Build Optimization**: Webpack can optimize bundle splitting

This documentation serves as the definitive guide for translation implementation and troubleshooting in the Health Check Kiosk application.
