// Site-wide links, kept in one place
export const SITE_URL = 'https://malaysiaperfumes.com'; // also set as `site` in astro.config.mjs
export const REPO_URL = 'https://github.com/fikfan/malaysian-perfume';
// Cloudflare Turnstile (the spam check on the contact form). This is the public site key; the secret is a Worker secret.
// Until the real widget exists, Cloudflare's test key, which always passes.
export const TURNSTILE_SITE_KEY = '1x00000000000000000000AA';
