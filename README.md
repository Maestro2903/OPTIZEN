# OPTIZEN

Eye Care Management System built with Next.js and Supabase.

## Getting Started

### Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (create `.env.local`):
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

For detailed deployment instructions, see the [deployment documentation](./docs/deployment/vercel.md).

### Quick Deploy to Vercel

1. Push your code to a Git repository
2. Import the project in [Vercel](https://vercel.com)
3. Add the required environment variables (see [deployment docs](./docs/deployment/vercel.md))
4. Deploy!

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)

## Model Context Protocol (MCP) Configuration

This project includes MCP configuration to enable AI assistants to interact with external tools:

- **Figma Integration**: Connect to Figma for design operations
- **Supabase Integration**: Connect to Supabase project for database operations

Configuration is stored in `mcp_config.json` (not committed for security) and `mcp_config.example.json` (template).

See [MCP configuration documentation](./docs/configuration/mcp-config.md) for detailed information about MCP configuration.

## Documentation

- [Deployment Guide](./docs/deployment/vercel.md) - Vercel deployment instructions
- [Deployment Steps](./docs/deployment/steps.md) - Step-by-step deployment process
- [Error Report](./docs/development/errors.md) - Error analysis and status
- [Unused Code Report](./docs/development/unused-code.md) - Unused code analysis
- [Unused Files Report](./docs/development/unused-files.md) - Unused files analysis
- [MCP Configuration](./docs/configuration/mcp-config.md) - Model Context Protocol setup
