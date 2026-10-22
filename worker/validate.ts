// Contact form fields: checked here, in plain TypeScript, so `npm test` can run it without Cloudflare.

const LIMITS = { brand: 100, name: 100, email: 200, link: 300, message: 3000 } as const;
type Field = keyof typeof LIMITS;

// one line, no control characters: these values go into the subject and the reply-to header
const oneLine = (s: string) => s.replace(/[\x00-\x1f\x7f]+/g, ' ').trim();

/** The form fields, or an error to show the visitor */
export function validate(form: FormData): { ok: true; v: Record<Field, string> } | { ok: false; error: string } {
  const v = {} as Record<Field, string>;
  for (const k of Object.keys(LIMITS) as Field[]) {
    const raw = form.get(k);
    v[k] = typeof raw === 'string' ? (k === 'message' ? raw.trim() : oneLine(raw)) : '';
    if (v[k].length > LIMITS[k]) return { ok: false, error: `The ${k} is too long.` };
  }
  if (!v.brand) return { ok: false, error: 'Enter the brand name.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return { ok: false, error: 'Enter a valid email address.' };
  if (v.link && !/^https?:\/\/\S+$/i.test(v.link)) return { ok: false, error: 'The link must start with https://' };
  if (!v.message) return { ok: false, error: 'Enter a message.' };
  return { ok: true, v };
}
