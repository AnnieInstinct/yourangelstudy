// YourAngelStudy Webhook - FINAL VERSION
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;

    const customerEmail = body.customer?.email || body.email;
    const productKey = body.items?.[0]?.product_key;

    if (!customerEmail || !productKey) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const token = generateToken(productKey);
    const productTier = getProductTier(productKey);

    // Save token to Supabase FIRST
    const { data: supabaseData, error: supabaseError } = await supabase
      .from('access_tokens')
      .insert({
        customer_email: customerEmail,
        token: token,
        language: 'en',
        devices: [],
        note: 'Auto-generated from webhook',
        product_tier: productTier
      })
      .select();

    if (supabaseError) {
      console.error('Supabase error:', supabaseError);
      return res.status(500).json({ error: 'Database save failed', details: supabaseError.message });
    }

    const customerName = extractNameFromEmail(customerEmail);
    const htmlContent = createEmailTemplate(customerName, customerEmail, token, productTier);

    // Send email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Your Angel Study <access@yourangelstudy.com>',
      to: [customerEmail],
      subject: '🎴 Your PMP™ Flashcards - Access Token Inside',
      html: htmlContent,
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      return res.status(200).json({
        success: true,
        token_saved: true,
        email_sent: false,
        warning: 'Email send failed but token was saved'
      });
    }

    return res.status(200).json({
      success: true,
      token_saved: true,
      email_sent: true,
      data: emailData
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

function generateToken(productKey) {
  let prefix;
  if (productKey === 'VTS6p') prefix = 'S';      // Starter (400 cards)
  else if (productKey === 'icjJO') prefix = 'C'; // Complete (800 cards)
  else if (productKey === 'js3FN') prefix = 'U'; // Ultimate (1300+ cards)
  else prefix = 'C';

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const segment2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

  return `YAS-${prefix}-${segment1}-${segment2}`;
}

function getProductTier(productKey) {
  if (productKey === 'VTS6p') return 'starter';
  if (productKey === 'icjJO') return 'complete';
  if (productKey === 'js3FN') return 'ultimate';
  return 'complete';
}

function extractNameFromEmail(email) {
  const localPart = email.split('@')[0];
  const name = localPart
    .replace(/[._-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  return name || 'there';
}

function createEmailTemplate(customerName, customerEmail, token, productTier) {
  const tierLabel = productTier === 'starter' ? 'Starter (400 cards)' :
                    productTier === 'ultimate' ? 'Ultimate (1,300+ cards)' :
                    'Complete (800 cards)';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your PMP Flashcards</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .hero {
      background: linear-gradient(135deg, #1a1d2e 0%, #2d3142 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .hero h1 { font-size: 36px; margin-bottom: 8px; font-weight: 600; color: #d4af37; }
    .hero p { font-size: 16px; color: #9ca3af; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; margin-bottom: 20px; color: #1f2937; }
    .tier-badge {
      display: inline-block;
      background: linear-gradient(135deg, #1a1d2e, #2d3142);
      color: #d4af37;
      font-size: 13px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 20px;
      margin-bottom: 20px;
      letter-spacing: 0.5px;
    }
    .token-box {
      background: linear-gradient(135deg, #d4af37 0%, #f4e4b5 100%);
      padding: 25px;
      margin: 30px 0;
      text-align: center;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(212,175,55,0.3);
    }
    .token {
      font-size: 28px;
      font-weight: 700;
      color: #1a1d2e;
      letter-spacing: 3px;
      font-family: 'Courier New', monospace;
    }
    .instructions {
      background-color: #f9fafb;
      padding: 25px;
      border-radius: 8px;
      margin: 25px 0;
      border-left: 4px solid #d4af37;
    }
    .instructions h3 { font-size: 18px; margin-bottom: 15px; color: #1f2937; }
    .instructions ol { margin: 0; padding-left: 20px; }
    .instructions li { margin: 12px 0; line-height: 1.6; color: #4b5563; }
    .instructions a { color: #d4af37; font-weight: 600; text-decoration: none; }
    .footer {
      margin-top: 30px;
      padding: 25px;
      background-color: #f9fafb;
      border-radius: 8px;
      text-align: center;
      color: #6b7280;
      line-height: 1.6;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 25px 0;
      border-radius: 6px;
      font-size: 14px;
      line-height: 1.5;
      color: #92400e;
    }
  </style>
</head>
<body>
<div class="container">
  <div class="hero">
    <h1>Your Angel Study</h1>
    <p>PMP™ Interactive Flashcards</p>
  </div>
  <div class="content">
    <h2 style="font-size: 28px; margin: 0 0 20px 0; font-weight: 600;">🎉 Your flashcards are ready!</h2>
    <div class="tier-badge">✦ ${tierLabel}</div>
    <p class="greeting">Hi ${customerName},</p>
    <p>Thank you for your purchase! Here is your personal access token:</p>
    <div class="token-box">
      <div class="token">${token}</div>
    </div>
    <div class="instructions">
      <h3>How to access your flashcards:</h3>
      <ol>
        <li>Go to <a href="https://yourangelstudy.com/access">yourangelstudy.com/access</a></li>
        <li>Enter your email: <strong>${customerEmail}</strong></li>
        <li>Enter your token above</li>
        <li>Start studying! 📚</li>
      </ol>
    </div>
    <div class="warning">
      <strong>⚠️ Keep this token private.</strong> It is personal to you and works on up to 2 devices.
    </div>
    <p style="color: #999; font-size: 14px; margin-top: 10px;">Works on iPhone, Android, Mac, and Windows</p>
  </div>
  <div class="footer">
    <p>Your dedication today is building your success tomorrow. Keep studying!</p>
    <p style="margin-top: 15px;">Good luck on your PMP™ exam! 🎯</p>
    <p><strong>Annie — Your Angel Study Team</strong></p>
    <p style="margin-top: 10px; font-size: 12px;">Questions? Reply to this email and I'll get back to you personally.</p>
  </div>
</div>
</body>
</html>`;
}
