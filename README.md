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

For detailed deployment instructions, see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md).

### Quick Deploy to Vercel

1. Push your code to a Git repository
2. Import the project in [Vercel](https://vercel.com)
3. Add the required environment variables (see VERCEL_DEPLOYMENT.md)
4. Deploy!

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed setup instructions.
