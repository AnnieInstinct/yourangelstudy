// YourAngelStudy Webhook - Updated with new email template
// This file replaces the existing /api/webhook.js

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
    }

  try {
        const body = req.body;

      // Extract customer info
      const customerEmail = body.customer?.email || body.email;
        const productKey = body.items?.[0]?.product_key;

      if (!customerEmail || !productKey) {
              return res.status(400).json({ error: 'Missing required fields' });
      }

      // Generate token
      const token = generateToken(productKey);

      // Extract customer name from email (or use generic greeting)
      const customerName = extractNameFromEmail(customerEmail);

      // Create HTML email with new template
      const htmlContent = createEmailTemplate(customerName, customerEmail, token);

      // Send email via Resend
      const { data, error } = await resend.emails.send({
              from: 'Your Angel Study <access@yourangelstudy.com>',
              to: [customerEmail],
              subject: '🎴 Your PMP™ Flashcards - Access Token Inside',
              html: htmlContent,
      });

      if (error) {
              console.error('Resend error:', error);
              return res.status(500).json({ error: 'Email send failed' });
      }

      // Save token to Supabase (existing code)
      // ... your Supabase code here ...

      return res.status(200).json({ success: true, data });

  } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).json({ error: 'Internal server error' });
  }
}

function generateToken(productKey) {
    // Your existing token generation logic
  const prefix = productKey.includes('starter') ? 'S' : 
                     productKey.includes('complete') ? 'C' : 'U';
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const random2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `YAS-${prefix}-${random}-${random2}`;
}

function extractNameFromEmail(email) {
    // Extract name from email or use generic greeting
  const namePart = email.split('@')[0];
    const name = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    return name;
}

function createEmailTemplate(customerName, customerEmail, token) {
    return `<!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8">
    <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        margin: 0;
          padding: 0;
            background-color: #f5f5f5;
            }

            .container {
              max-width: 600px;
                margin: 0 auto;
                  background-color: #ffffff;
                  }

                  .hero {
                    background-color: #1a1d2e;
                      padding: 40px 20px;
                        text-align: center;
                        }

                        .hero h1 {
                          color: #d4af37;
                            font-size: 32px;
                              margin: 0 0 10px 0;
                                font-weight: 600;
                                }

                                .hero p {
                                  color: #9ca3af;
                                    font-size: 16px;
                                      margin: 0;
                                      }

                                      .content {
                                        padding: 40px 30px;
                                        }

                                        .greeting {
                                          font-size: 18px;
                                            margin-bottom: 20px;
                                            }

                                            .token-box {
                                              background-color: #d4af37;
                                                padding: 18px 50px;
                                                  margin: 20px auto;
                                                    text-align: center;
                                                      border-radius: 50px;
                                                        max-width: 400px;
                                                        }

                                                        .token-box .token {
                                                          font-size: 20px;
                                                            font-weight: 600;
                                                              color: #000000;
                                                                letter-spacing: 3px;
                                                                }

                                                                .instructions {
                                                                  background-color: #f5f5f5;
                                                                    padding: 25px;
                                                                      border-radius: 8px;
                                                                        margin: 30px 0;
                                                                        }

                                                                        .instructions h3 {
                                                                          margin: 0 0 15px 0;
                                                                            font-size: 16px;
                                                                              font-weight: 600;
                                                                              }

                                                                              .instructions ol {
                                                                                margin: 0;
                                                                                  padding-left: 20px;
                                                                                  }

                                                                                  .instructions li {
                                                                                    margin: 10px 0;
                                                                                      line-height: 1.6;
                                                                                      }

                                                                                      .instructions strong {
                                                                                        font-weight: 600;
                                                                                        }

                                                                                        a {
                                                                                          color: #0066cc;
                                                                                            text-decoration: none;
                                                                                            }

                                                                                            a:hover {
                                                                                              text-decoration: underline;
                                                                                              }

                                                                                              .warning {
                                                                                                background-color: #fef3cd;
                                                                                                  border-left: 4px solid #f59e0b;
                                                                                                    padding: 15px 10px;
                                                                                                      margin: 25px 0 5px 0;
                                                                                                        border-radius: 4px;
                                                                                                          font-size: 14px;
                                                                                                          }
                                                                                                          
                                                                                                          .warning strong {
                                                                                                            font-weight: 600;
                                                                                                            }
                                                                                                            
                                                                                                            .footer {
                                                                                                              margin-top: 40px;
                                                                                                                padding-top: 20px;
                                                                                                                  border-top: 1px solid #e5e7eb;
                                                                                                                  }
                                                                                                                  
                                                                                                                  .footer p {
                                                                                                                    margin: 5px 0;
                                                                                                                    }
                                                                                                                    
                                                                                                                    .footer strong {
                                                                                                                      font-weight: 600;
                                                                                                                      }
                                                                                                                      </style>
                                                                                                                      </head>
                                                                                                                      <body>
                                                                                                                      
                                                                                                                      <div class="container">
                                                                                                                        
                                                                                                                          <!-- Hero Section -->
                                                                                                                            <div class="hero">
                                                                                                                                <h1>Your Angel Study</h1>
                                                                                                                                    <p>Interactive Flashcards</p>
                                                                                                                                      </div>
                                                                                                                                      
                                                                                                                                        <!-- Main Content -->
                                                                                                                                          <div class="content">
                                                                                                                                              
                                                                                                                                                  <h2 style="font-size: 28px; margin: 0 0 30px 0; font-weight: 600;">🎉 Your PMP™ Flashcards are ready!</h2>
                                                                                                                                                      
                                                                                                                                                          <p class="greeting">Hi ${customerName},</p>
                                                                                                                                                              
                                                                                                                                                                  <p>Thank you for your purchase! Here's your access key:</p>
                                                                                                                                                                  
                                                                                                                                                                      <!-- Token Box -->
                                                                                                                                                                          <div class="token-box">
                                                                                                                                                                                <div class="token">${token}</div>
                                                                                                                                                                                    </div>
                                                                                                                                                                                    
                                                                                                                                                                                        <!-- Instructions -->
                                                                                                                                                                                            <div class="instructions">
                                                                                                                                                                                                  <h3>How to access your flashcards:</h3>
                                                                                                                                                                                                        <ol>
                                                                                                                                                                                                                <li>Go to <a href="https://yourangelstudy.com/access">yourangelstudy.com/access</a></li>
                                                                                                                                                                                                                        <li>Enter your email: <strong>${customerEmail}</strong></li>
                                                                                                                                                                                                                                <li>Enter your key: <strong>${token}</strong></li>
                                                                                                                                                                                                                                        <li>Start studying! 📚</li>
                                                                                                                                                                                                                                              </ol>
                                                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                      <!-- Footer -->
                                                                                                                                                                                                                                                          <div class="footer">
                                                                                                                                                                                                                                                                <p>Your dedication today is building your success tomorrow. Keep studying!</p>
                                                                                                                                                                                                                                                                      <p style="margin-top: 25px;">Good luck on your PMP™ exam! 🎯</p>
                                                                                                                                                                                                                                                                            <p><strong>Your Angel Study Team</strong></p>
                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                    <!-- Security Warning -->
                                                                                                                                                                                                                                                                                        <div class="warning">
                                                                                                                                                                                                                                                                                              <strong>⚠️ Keep this key private.</strong> This key is personal to you and cannot be shared with anyone. It works on up to 3 devices.
                                                                                                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                      <!-- Device Compatibility -->
                                                                                                                                                                                                                                                                                                          <p style="color: #999; font-size: 14px; margin: 3px 0 20px 0;">
                                                                                                                                                                                                                                                                                                                Works on iPhone, Android, Mac, and Windows
                                                                                                                                                                                                                                                                                                                    </p>
                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                      </body>
                                                                                                                                                                                                                                                                                                                      </html>`;
}
