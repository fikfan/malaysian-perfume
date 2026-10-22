// The site is static files; this Worker only answers POST /api/contact (wrangler.jsonc sends only /api/* here).
// It checks Turnstile, validates the fields, and emails the message to CONTACT_TO. The address never reaches the page.

import { validate } from './validate.ts';

const FROM = { email: 'contact@malaysianperfumes.com', name: 'Malaysian Perfumes' };
const json = (status: number, body: object) => Response.json(body, { status });

async function human(token: string, ip: string | null, secret: string) {
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) }),
  });
  return ((await r.json()) as { success: boolean }).success === true;
}

export default {
  async fetch(req, env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname !== '/api/contact') return json(404, { error: 'Not found.' });
    if (req.method !== 'POST') return json(405, { error: 'Use POST.' });
    // forms from other sites cannot post here
    if (req.headers.get('origin') !== url.origin) return json(403, { error: 'Send the form from this site.' });
    if (Number(req.headers.get('content-length') ?? 0) > 20_000) return json(413, { error: 'The message is too long.' });

    let form: FormData;
    try { form = await req.formData(); } catch { return json(400, { error: 'The form could not be read.' }); }

    const token = form.get('cf-turnstile-response');
    if (typeof token !== 'string' || !token || !(await human(token, req.headers.get('cf-connecting-ip'), env.TURNSTILE_SECRET))) {
      return json(400, { error: 'The spam check failed. Reload the page and try again.' });
    }
    const r = validate(form);
    if (!r.ok) return json(400, { error: r.error });
    const { brand, name, email, link, message } = r.v;

    try {
      await env.EMAIL.send({
        from: FROM,
        to: env.CONTACT_TO,
        replyTo: email,
        subject: `Feature request: ${brand}`,
        text: [`Brand: ${brand}`, `Name: ${name || '-'}`, `Email: ${email}`, `Link: ${link || '-'}`, '', message].join('\n'),
      });
    } catch (e) {
      console.error('contact send failed', (e as { code?: string }).code, (e as Error).message);
      return json(502, { error: 'The message could not be sent. Try again later.' });
    }
    return json(200, { ok: true });
  },
} satisfies ExportedHandler<Env>;
