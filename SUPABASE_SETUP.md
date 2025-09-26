# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `ai-dnd-game`
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

## 2. Get Your Project Credentials

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## 3. Set Up Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Google OAuth (Removed - using Supabase email auth instead)

# Existing AI Configuration
GOOGLE_API_KEY=your-existing-google-api-key
```

## 4. Set Up the Database

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase-schema.sql` from this project
3. Paste it into the SQL Editor
4. Click **Run** to execute the schema

This will create:
- Users table (extends auth.users)
- Characters table (4 character limit per user)
- Stories table (2 story limit per user)
- Story sessions table
- Row Level Security policies
- Triggers for automatic user creation

## 5. Configure Google OAuth (Optional)

### 5.1 Create Google OAuth App

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - `https://your-project-id.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for development)
7. Copy the **Client ID** and **Client Secret**

### 5.2 Configure Supabase Auth

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Google** provider
3. Enter your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
4. Set **Redirect URL**: `https://your-project-id.supabase.co/auth/v1/callback`
5. Save the configuration

## 6. Test the Setup

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000`
3. Try creating an account with email/password
4. Try signing in with Google (if configured)
5. Create a character and verify it's saved to the database

## 7. Database Features

### Row Level Security (RLS)
- Users can only access their own data
- Automatic user profile creation on signup
- Secure data isolation between users

### Character Management
- 4 character limit per user
- Full D&D stats and progression
- JSON fields for skills, abilities, spells, inventory

### Story Management
- 2 story limit per user
- Game state persistence
- Session tracking

### Authentication
- Email/password authentication
- Google OAuth integration
- Secure JWT tokens
- Automatic session management

## 8. Production Deployment

### Vercel Deployment
1. Add environment variables in Vercel dashboard
2. Deploy your application
3. Update Google OAuth redirect URIs to include your production domain

### Database Backups
- Supabase automatically handles backups
- You can also export your schema and data from the dashboard

## 9. Monitoring

- **Database**: Monitor in Supabase dashboard
- **Auth**: Check authentication logs in Supabase
- **Performance**: Use Supabase analytics

## Troubleshooting

### Common Issues

1. **"Invalid API key"**: Check your environment variables
2. **"User not found"**: Ensure RLS policies are set up correctly
3. **Google OAuth not working**: Verify redirect URIs and client credentials
4. **Database connection issues**: Check your Supabase URL and network connectivity

### Support
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Next.js Documentation](https://nextjs.org/docs)
