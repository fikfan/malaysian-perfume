// Unit tests for the contact form checks. Run with `npm test` (Node strips the types).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate } from './validate.ts';

const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries({ brand: 'Acme', email: 'a@acme.my', message: 'Hello', ...fields })) f.set(k, v);
  return f;
};

test('a complete form passes, with whitespace trimmed', () => {
  const r = validate(form({ brand: '  Acme  ', link: 'https://acme.my' }));
  assert.ok(r.ok);
  assert.equal(r.v.brand, 'Acme');
  assert.equal(r.v.name, '');
});

test('missing or bad fields fail with a message for the visitor', () => {
  assert.deepEqual(validate(form({ brand: '' })), { ok: false, error: 'Enter the brand name.' });
  assert.deepEqual(validate(form({ email: 'not-an-email' })), { ok: false, error: 'Enter a valid email address.' });
  assert.deepEqual(validate(form({ link: 'javascript:alert(1)' })), { ok: false, error: 'The link must start with https://' });
  assert.deepEqual(validate(form({ message: '   ' })), { ok: false, error: 'Enter a message.' });
  assert.deepEqual(validate(form({ message: 'x'.repeat(3001) })), { ok: false, error: 'The message is too long.' });
});

test('line breaks cannot reach the subject or the reply-to header', () => {
  const r = validate(form({ brand: 'Acme\r\nBcc: x@evil.com', email: 'a@acme.my' }));
  assert.ok(r.ok);
  assert.equal(r.v.brand, 'Acme Bcc: x@evil.com');
  assert.ok(!validate(form({ email: 'a@acme.my\nBcc: x@evil.com' })).ok);
});

test('the message keeps its line breaks', () => {
  const r = validate(form({ message: 'line 1\nline 2' }));
  assert.ok(r.ok);
  assert.equal(r.v.message, 'line 1\nline 2');
});
