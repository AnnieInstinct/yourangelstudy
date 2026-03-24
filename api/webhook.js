// Vercel Serverless Function — PayHip Webhook
// Receives purchase notification → generates token → sends email to customer

const SUPABASE_URL = 'https://wmveayasaerptxpafmzc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const RESEND_KEY = process.env.RESEND_KEY;
const BASE_URL = 'https://yourangelstudy.com';

const PRODUCT_LANG_MAP = {
  [process.env.PRODUCT_ID_EN]: 'en',
  [process.env.PRODUCT_ID_IT]: 'it',
  [process.env.PRODUCT_ID_FR]: 'fr',
  [process.env.PRODUCT_ID_DE]: 'de',
  [process.env.PRODUCT_ID_RU]: 'ru',
};

const LANG_NAMES = {
  en: 'English',
  it: 'Italian / Italiano',
  fr: 'French / Français',
  de: 'German / Deutsch',
  ru: 'Russian / Русский',
};

function makeToken() {
  const array = new Uint8Array(20);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function saveToken(token, lang, customerName) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/access_tokens`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ token, language: lang, devices: [], note: customerName }),
  });
  return res.ok;
}

async function sendEmail(toEmail, toName, token, lang) {
  const link = `${BASE_URL}/play?t=${token}&l=${lang}`;
  const langName = LANG_NAMES[lang] || lang.toUpperCase();
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:-apple-system,sans-serif;background:#f5f5f5;margin:0;padding:20px;"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,.08);"><div style="background:#1a1a2e;padding:32px 32px 24px;text-align:center;"><div style="font-family:Georgia,serif;font-style:italic;font-size:26px;color:#c9a227;">Your Angel Study</div><div style="color:#888;font-size:13px;margin-top:4px;">800 PMP Interactive Flashcards</div></div><div style="padding:32px;"><p style="font-size:16px;color:#333;margin:0 0 8px;">Hi ${toName || 'there'}! 👋</p><p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 24px;">Thank you for your purchase! Your <strong>${langName}</strong> flashcard deck is ready.</p><div style="background:#f8f4e8;border:2px solid #c9a227;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;"><div style="font-size:13px;color:#888;margin-bottom:8px;">📱 Study on iPhone &amp; Android</div><a href="${link}" style="display:inline-block;background:#c9a227;color:#000;text-decoration:none;padding:14px 28px;border-radius:30px;font-weight:700;font-size:15px;">Open My Flashcards →</a><div style="font-size:11px;color:#aaa;margin-top:10px;">Tap this button on your phone to study in Safari</div></div><div style="background:#f5f5f5;border-radius:8px;padding:14px;font-size:12px;color:#888;line-height:1.8;margin-bottom:24px;"><strong style="color:#555;">How to use:</strong><br>📱 <strong>iPhone/iPad:</strong> Tap the button in Safari<br>🤖 <strong>Android:</strong> Tap the button in Chrome<br>💻 <strong>Mac/Windows:</strong> Use the downloaded .html file from PayHip</div><div style="background:#fff8e8;border:1px solid #f0e0b0;border-radius:8px;padding:12px;font-size:12px;color:#888;margin-bottom:24px;">⚠️ <strong>Keep this link private</strong> — personal to you, works on up to 3 devices.</div><p style="color:#555;font-size:13px;">Good luck on your PMP exam! 🎯<br><strong>Your Angel Study Team</strong></p></div><div style="background:#f5f5f5;padding:16px 32px;text-align:center;font-size:11px;color:#aaa;">yourangelstudy.com</div></div></body></html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Your Angel Study <study@yourangelstudy.com>',
      to: toEmail,
      subject: `🎴 Your ${langName} PMP Flashcards — Mobile Access Link`,
      html,
    }),
  });
  return res.ok;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const body = req.body;
    const productId = body.product_id || body.permalink;
    const customerEmail = body.email || body.buyer_email;
    const customerName = body.first_name || body.buyer_name || '';
    if (!customerEmail) return res.status(400).json({ error: 'No customer email' });
    let lang = PRODUCT_LANG_MAP[productId];
    if (!lang && body.product_title) {
      const t = (body.product_title || '').toLowerCase();
      if (t.includes('de') || t.includes('german')) lang = 'de';
      else if (t.includes('fr') || t.includes('french')) lang = 'fr';
      else if (t.includes('ru') || t.includes('russian')) lang = 'ru';
      else if (t.includes('it') || t.includes('ital')) lang = 'it';
      else lang = 'en';
    }
    if (!lang) lang = 'en';
    const token = makeToken();
    await saveToken(token, lang, `${customerName} <${customerEmail}>`);
    await sendEmail(customerEmail, customerName, token, lang);
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
