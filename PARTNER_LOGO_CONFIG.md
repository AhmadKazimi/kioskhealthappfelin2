# Partner Logo Configuration

This application supports configurable partner logos through environment variables.

## Environment Variable

- `NEXT_PUBLIC_PARTNER_LOGO_URL`: The URL path to the partner logo image

## Usage

### To Show the Partner Logo

Set the environment variable to the path of your logo image in the appropriate environment file:

```bash
# In .env.development (for development)
NEXT_PUBLIC_PARTNER_LOGO_URL=/PartnershipLogo2.png

# In .env.production (for production)
NEXT_PUBLIC_PARTNER_LOGO_URL=/PartnershipLogo2.png
```

### To Hide the Partner Logo

Set the environment variable to empty or comment it out:

```bash
# In .env.development or .env.production
NEXT_PUBLIC_PARTNER_LOGO_URL=

# Or comment it out
# NEXT_PUBLIC_PARTNER_LOGO_URL=/PartnershipLogo2.png
```

## File Locations

The partner logo appears in the welcome screen component in two locations:
- Mobile layout: Top left corner
- Desktop layout: Above the main title

## Environment Files

The configuration is added to the existing environment files:
- `.env.development` - Development environment settings
- `.env.production` - Production environment settings

## Notes

- The logo will only be displayed if the environment variable is set and not empty
- The logo path should be relative to the `public` directory
- Changes to environment variables require restarting the development server
- The configuration uses the existing environment file structure in your project
