// Vercel Serverless Function — PayHip Webhook (con sistema chiave + email)
const SUPABASE_URL = 'https://lwjpaztgxykfdwtjxxvs.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Mapping Product ID → Tier (aggiornato con i veri Product ID)
const PRODUCT_TIERS = {
  'VTS6p': 'starter',    // 400 cards - $19
  'icjJO': 'complete',   // 800 cards - $35
  'js3FN': 'ultimate'    // 1,300+ cards - $49
};

function generateKey(tier) {
  const prefix = tier === 'starter' ? 'YAS-S' : tier === 'complete' ? 'YAS-C' : 'YAS-U';
  const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${part1}-${part2}`;
}

async function saveKeyToSupabase(key, email, tier) {
  const payload = { 
    token: key, 
    customer_email: email,
    product_tier: tier,
    language: 'en',
    devices: [],
    note: `Purchase - ${email}`
  };
  
  console.log('Saving to Supabase:', JSON.stringify(payload));
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/access_tokens`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Supabase error:', res.status, errorText);
    throw new Error(`Supabase save failed: ${res.status} - ${errorText}`);
  }
  
  console.log('Supabase save successful');
  return true;
}

async function sendEmail(toEmail, toName, key, tier) {
  const cardCount = tier === 'starter' ? '400' : tier === 'complete' ? '800' : '1,300+';
  
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:'Playfair Display',serif;max-width:600px;margin:40px auto;padding:20px;background:#0a0a0a;color:#ffffff;">
  <div style="text-align:center;padding:30px;">
    <h1 style="color:#d4af37;font-size:32px;margin-bottom:10px;">Your Angel Study</h1>
    <h2 style="color:#ffffff;font-size:24px;font-weight:normal;">Your PMP Flashcards Are Ready! 🎉</h2>
  </div>
  
  <p style="font-size:18px;line-height:1.6;">Hi ${toName || 'there'},</p>
  <p style="font-size:18px;line-height:1.6;">Thank you for your purchase! You now have access to <strong style="color:#d4af37;">${cardCount} premium PMP flashcards</strong>.</p>
  
  <div style="background:rgba(212,175,55,0.1);border:2px solid #d4af37;border-radius:12px;padding:30px;text-align:center;margin:30px 0;">
    <p style="font-size:16px;color:#cccccc;margin-bottom:15px;">Your Access Token:</p>
    <div style="font-size:28px;font-weight:bold;color:#d4af37;letter-spacing:3px;">${key}</div>
  </div>
  
  <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:25px;margin:30px 0;">
    <p style="font-size:18px;font-weight:bold;color:#d4af37;margin-bottom:15px;">How to Access Your Flashcards:</p>
    <ol style="font-size:16px;line-height:1.8;padding-left:20px;">
      <li>Go to <a href="https://yourangelstudy.com/access.html" style="color:#d4af37;text-decoration:none;">yourangelstudy.com/access.html</a></li>
      <li>Enter your email: <strong>${toEmail}</strong></li>
      <li>Enter your token: <strong>${key}</strong></li>
      <li>Start studying! 📚</li>
    </ol>
  </div>
  
  <p style="font-size:14px;color:#888;margin-top:30px;line-height:1.6;">
    💡 <strong>Keep this token safe</strong> - you'll need it to access your flashcards.<br>
    📱 Works on iPhone, Android, Mac, and Windows.<br>
    🔄 Lifetime access - no subscription required.
  </p>
  
  <div style="text-align:center;margin-top:40px;padding-top:30px;border-top:1px solid rgba(255,255,255,0.1);">
    <p style="font-size:16px;color:#ffffff;">Good luck on your PMP exam!</p>
    <p style="font-size:18px;color:#d4af37;font-weight:bold;">Your Angel Study Team</p>
    <p style="font-size:13px;color:#666;margin-top:20px;">Questions? Contact us at yourangelstudy@protonmail.com</p>
  </div>
  
  <p style="font-size:12px;color:#444;margin-top:30px;line-height:1.6;">
    PMP is a registered mark of PMI. This product is not affiliated with, endorsed by, or sponsored by PMI.
  </p>
</body>
</html>`;

  console.log('Sending email to:', toEmail);
  
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${RESEND_API_KEY}`, 
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({
      from: 'Your Angel Study <access@yourangelstudy.com>',
      to: toEmail,
      subject: `🎴 Your ${cardCount} PMP Flashcards - Access Token Inside`,
      html,
    }),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Resend error:', res.status, errorText);
    throw new Error(`Email send failed: ${res.status}`);
  }
  
  console.log('Email sent successfully');
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    console.log('Full webhook body:', JSON.stringify(body, null, 2));
    
    // PayHip invia diversi campi, proviamo tutti
    const productId = body.product?.permalink || body.product_permalink || body.permalink || body.product_id;
    const customerEmail = body.customer?.email || body.email || body.buyer_email;
    const customerName = body.customer?.first_name || body.first_name || body.buyer_name || '';

    console.log('Extracted data:', { productId, customerEmail, customerName });

    if (!customerEmail) {
      console.error('No customer email found in webhook');
      return res.status(400).json({ error: 'No customer email' });
    }

    if (!productId) {
      console.error('No product ID found in webhook');
      return res.status(400).json({ error: 'No product ID' });
    }

    // Determina tier
    const tier = PRODUCT_TIERS[productId];
    
    if (!tier) {
      console.error('Unknown product ID:', productId);
      return res.status(400).json({ error: `Unknown product: ${productId}` });
    }

    console.log('Determined tier:', tier);

    // Genera chiave
    const key = generateKey(tier);
    console.log('Generated key:', key);

    // Salva in Supabase
    await saveKeyToSupabase(key, customerEmail, tier);

    // Manda email
    await sendEmail(customerEmail, customerName, key, tier);

    return res.status(200).json({ success: true, key, tier });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
