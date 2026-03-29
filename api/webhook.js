// Vercel Serverless Function — PayHip Webhook (con sistema chiave + email)

const SUPABASE_URL = 'https://lwjpaztgxykfdwtjxxvs.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Mapping Product ID → Tier
const PRODUCT_TIERS = {
  'CE5Am': 'starter',   // YAS Starter - 400 cards EN
  // Aggiungi altri product ID qui quando li hai
};

function generateKey(tier) {
  const prefix = tier === 'starter' ? 'YAS-S' : tier === 'complete' ? 'YAS-C' : 'YAS-U';
  const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${part1}-${part2}`;
}

async function saveKeyToSupabase(key, email, tier) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/access_tokens`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ 
      token: key, 
      customer_email: email,
      product_tier: tier,
      language: 'en',
      devices: [],
      note: `Purchase - ${email}`
    }),
  });
  return res.ok;
}

async function sendEmail(toEmail, toName, key) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;max-width:600px;margin:40px auto;padding:20px;">
  <h2>🎉 Your PMP Flashcards are Ready!</h2>
  <p>Hi ${toName || 'there'},</p>
  <p>Thank you for your purchase! Here's your access key:</p>
  
  <div style="background:#f5f5f5;border:2px solid #c9a227;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
    <div style="font-size:24px;font-weight:bold;color:#c9a227;letter-spacing:2px;">${key}</div>
  </div>
  
  <p><strong>How to access your flashcards:</strong></p>
  <ol>
    <li>Go to <a href="https://yourangelstudy.com/access">yourangelstudy.com/access</a></li>
    <li>Enter your email: <strong>${toEmail}</strong></li>
    <li>Enter your key: <strong>${key}</strong></li>
    <li>Start studying! 📚</li>
  </ol>
  
  <p style="font-size:12px;color:#888;margin-top:30px;">Keep this key safe - you'll need it to access your flashcards.<br>Works on iPhone, Android, Mac, and Windows.</p>
  
  <p>Good luck on your PMP exam!<br><strong>Your Angel Study Team</strong></p>
</body>
</html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${RESEND_API_KEY}`, 
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({
      from: 'Your Angel Study <study@yourangelstudy.com>',
      to: toEmail,
      subject: '🎴 Your PMP Flashcards Access Key',
      html,
    }),
  });
  return res.ok;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    const productId = body.product_id || body.permalink;
    const customerEmail = body.email || body.buyer_email;
    const customerName = body.first_name || body.buyer_name || '';

    if (!customerEmail) {
      return res.status(400).json({ error: 'No customer email' });
    }

    // Determina tier
    const tier = PRODUCT_TIERS[productId] || 'starter';

    // Genera chiave
    const key = generateKey(tier);

    // Salva in Supabase
    await saveKeyToSupabase(key, customerEmail, tier);

    // Manda email
    await sendEmail(customerEmail, customerName, key);

    return res.status(200).json({ success: true, key });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: err.message });
  }
}
