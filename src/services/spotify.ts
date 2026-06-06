const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const SCOPES = 'user-read-email user-read-private';

export interface SpotifyUser {
  display_name: string;
  email: string;
  id: string;
  images: Array<{ url: string; height?: number; width?: number }>;
}

const getRedirectUri = (): string => {
  const hostname = window.location.hostname;
  if (hostname === '127.0.0.1' || hostname === 'localhost') {
    return 'http://127.0.0.1:5173/callback';
  }
  return 'https://focusnest-rust.vercel.app/callback';
};

// Generates a cryptographically strong random string
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = window.crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

// Base64url encodes an array buffer
function base64urlencode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Hashes a plain string using SHA-256
async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

export async function loginWithSpotify(): Promise<void> {
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64urlencode(hashed);

  localStorage.setItem('spotify_code_verifier', codeVerifier);

  const redirectUri = getRedirectUri();
  const authUrl = new URL('https://accounts.spotify.com/authorize');
  
  authUrl.searchParams.append('client_id', CLIENT_ID);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('code_challenge_method', 'S256');
  authUrl.searchParams.append('code_challenge', codeChallenge);
  authUrl.searchParams.append('scope', SCOPES);

  window.location.href = authUrl.toString();
}

export async function handleSpotifyCallback(code: string): Promise<SpotifyUser> {
  const codeVerifier = localStorage.getItem('spotify_code_verifier');
  if (!codeVerifier) {
    throw new Error('Spotify login session expired. Please try again.');
  }

  const redirectUri = getRedirectUri();

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to token exchange:', errorText);
    throw new Error('Failed to complete Spotify authentication.');
  }

  const data = await response.json();
  const accessToken = data.access_token;

  localStorage.setItem('spotify_access_token', accessToken);
  localStorage.removeItem('spotify_code_verifier');

  // Fetch Spotify user profile
  const profileResponse = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!profileResponse.ok) {
    const errorText = await profileResponse.text();
    console.error('Failed to fetch user profile:', errorText);
    throw new Error('Failed to retrieve Spotify user profile.');
  }

  const profile: SpotifyUser = await profileResponse.json();
  localStorage.setItem('spotify_user_profile', JSON.stringify(profile));

  return profile;
}

export function logoutSpotify(): void {
  localStorage.removeItem('spotify_access_token');
  localStorage.removeItem('spotify_user_profile');
}

export function getCurrentSpotifyUser(): SpotifyUser | null {
  const token = localStorage.getItem('spotify_access_token');
  const profileStr = localStorage.getItem('spotify_user_profile');
  if (!token || !profileStr) {
    return null;
  }
  try {
    return JSON.parse(profileStr) as SpotifyUser;
  } catch (e) {
    console.error('Failed to parse Spotify user profile:', e);
    return null;
  }
}
