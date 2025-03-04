import { json, redirect } from '@remix-run/cloudflare';

interface SupabaseTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code) {
    console.error('Missing code parameter');
    return json({ error: 'Missing code parameter' }, { status: 400 });
  }

  if (!state) {
    console.error('Missing state parameter');
    return json({ error: 'Missing state parameter' }, { status: 400 });
  }

  const storedState = request.headers.get('cookie')?.split('; ').find(cookie => cookie.startsWith('supabase_auth_state='))?.split('=')[1];

  if (!storedState) {
    console.error('Missing stored state');
    return json({ error: 'Missing stored state' }, { status: 400 });
  }

  if (state !== storedState) {
    console.error('Invalid state parameter');
    return json({ error: 'Invalid state parameter' }, { status: 400 });
  }

  try {
    const clientId = process.env.SUPABASE_CLIENT_ID;
    const clientSecret = process.env.SUPABASE_CLIENT_SECRET;
    const redirectUri = url.origin + '/api/supabase/callback';
    const codeVerifier = request.headers.get('cookie')?.split('; ').find(cookie => cookie.startsWith('supabase_code_verifier='))?.split('=')[1];

    if (!codeVerifier) {
      console.error('Missing code verifier');
      return json({ error: 'Missing code verifier' }, { status: 400 });
    }

    if (!clientId) {
      console.error('Missing SUPABASE_CLIENT_ID environment variable');
      return json({ error: 'Missing SUPABASE_CLIENT_ID environment variable' }, { status: 500 });
    }

    if (!clientSecret) {
      console.error('Missing SUPABASE_CLIENT_SECRET environment variable');
      return json({ error: 'Missing SUPABASE_CLIENT_SECRET environment variable' }, { status: 500 });
    }

    const tokenResponse = await fetch('https://api.supabase.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Failed to exchange code for token:', tokenResponse.status, await tokenResponse.text());
      return json({ error: 'Failed to exchange code for token' }, { status: 400 });
    }

    const tokenData = await tokenResponse.json() as SupabaseTokenResponse;
    const { access_token, refresh_token } = tokenData;

    localStorage.setItem('supabase_access_token', access_token);
    localStorage.setItem('supabase_refresh_token', refresh_token);

    // Redirect the user back to the settings page
    return redirect('/settings/connections');
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    return json({ error: 'Error exchanging code for token' }, { status: 500 });
  }
}