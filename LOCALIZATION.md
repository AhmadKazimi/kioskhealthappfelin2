# Internationalization (i18n) Implementation

This project now supports multiple languages with Arabic and English translations implemented.

## Features

- **Languages Supported**: English (en), Arabic (ar)
- **RTL Support**: Full right-to-left layout support for Arabic
- **Dynamic Language Switching**: Users can switch languages at runtime
- **Persistent Language Selection**: Language preference is saved in localStorage

## Implementation Details

### Libraries Used
- `react-i18next`: Main internationalization library
- `i18next`: Core i18n functionality
- `i18next-browser-languagedetector`: Browser language detection

### File Structure
```
src/
├── lib/i18n.ts                    # i18n configuration
├── hooks/useTranslation.ts        # Custom translation hook
├── components/
│   ├── language-switcher.tsx      # Language switcher component
│   └── i18n-provider.tsx          # i18n provider wrapper
├── styles/rtl.css                 # RTL styles for Arabic
└── public/locales/
    ├── en/common.json             # English translations
    └── ar/common.json             # Arabic translations
```

## Usage

### Using Translations in Components

1. Import the custom hook:
```tsx
import { useTranslation } from "@/hooks/useTranslation";
```

2. Use the translation function:
```tsx
function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('welcome.title')}</h1>
      <p>{t('welcome.subtitle')}</p>
    </div>
  );
}
```

### Adding New Translations

1. Add the translation key to both `public/locales/en/common.json` and `public/locales/ar/common.json`
2. Use the key in your component with the `t()` function

### Language Switcher

The language switcher component is already integrated into key screens:
- Welcome screen
- Personal info screen  
- Face scan screen

To add it to other components:
```tsx
import LanguageSwitcher from "@/components/language-switcher";

// In your component JSX:
<LanguageSwitcher />
```

## RTL Support

The project includes comprehensive RTL support for Arabic:
- Text direction changes automatically
- Layout elements are mirrored appropriately
- Input fields align correctly
- Spacing and margins are adjusted

## Translation Keys Structure

The translations are organized into logical groups:

- `welcome.*` - Welcome screen content
- `personalInfo.*` - Personal information form
- `faceScan.*` - Face scanning interface
- `userInfo.*` - User details form
- `buttons.*` - Common buttons (back, next, etc.)
- `common.*` - Common UI text (loading, errors, etc.)

## Adding New Languages

To add a new language:

1. Create a new folder in `public/locales/` (e.g., `fr` for French)
2. Copy `common.json` from an existing language and translate all values
3. Add the language code to the `locales` array in:
   - `next.config.ts`
   - `src/lib/i18n.ts`
   - `src/components/language-switcher.tsx`

## Best Practices

1. **Use semantic keys**: Instead of `button1`, use `buttons.submit`
2. **Keep translations in sync**: When adding new keys, add them to all language files
3. **Test RTL layout**: Always test Arabic layout for proper RTL rendering
4. **Use interpolation for dynamic content**: 
   ```tsx
   t('welcome.greeting', { name: userName })
   ```
5. **Keep strings in translation files**: Avoid hardcoded text in components

## Testing

To test the localization:
1. Run the development server: `npm run dev`
2. Use the language switcher in the top-right corner
3. Verify that all text changes language
4. Check that Arabic layout displays correctly in RTL mode

## Components Updated

The following components have been updated with translation support:
- ✅ `welcome-screen.tsx`
- ✅ `personal-info-screen.tsx` 
- ✅ `face-scan-screen.tsx`
- ⏳ Other components can be updated following the same pattern

## Future Enhancements

- Add more languages as needed
- Implement server-side language detection
- Add translation management system
- Implement pluralization rules for complex translations 