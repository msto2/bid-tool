import { json } from '@sveltejs/kit';
import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';
import { BREVO_API_KEY, TEXTBEE_API_KEY, TEXTBEE_DEVICE_ID, CONTACTS } from '$env/static/private';
import { dev } from '$app/environment';
import { devConfig } from '$lib/devMode.js';

// Initialize Brevo API
const emailApi = new TransactionalEmailsApi();
emailApi.authentications.apiKey.apiKey = BREVO_API_KEY;

// In development, we'll generate simple codes
// In production, you would integrate with services like:
// - Twilio for SMS
// - Brevo, SendGrid, Mailgun, or similar for email

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function maskEmail(email) {
  const [local, domain] = email.split('@');
  const maskedLocal = local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1);
  return `${maskedLocal}@${domain}`;
}

function maskPhone(phone) {
  return phone.replace(/(\d{3})\d{3}(\d{4})/, '$1***$2');
}

async function sendEmailCode(email, code) {
  // Log the code in development only
  if (dev) {
    console.log(`📧 Email verification code for ${email}: ${code}`);
  }
  
  // Skip actual email sending in dev mode
  if (devConfig.skipEmailSending) {
    console.log('🔧 Dev mode: Skipping email sending, code logged above');
    return true;
  }
  
  try {
    const sendSmtpEmail = new SendSmtpEmail();
    
    sendSmtpEmail.subject = 'Fantasy League Verification Code';
    sendSmtpEmail.sender = { name: 'Aliquippa Keeper League', email: 'admin@triplepoint.me' };
    sendSmtpEmail.to = [{ email: email }];
    sendSmtpEmail.textContent = `Your verification code is: ${code}`;
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #3b82f6;">Fantasy League Verification</h2>
        <p>Your verification code for the Aliquippa Keeper League is:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${code}</span>
        </div>
        <p style="color: #6b7280;">Enter this code in your browser to complete sign-in.</p>
        <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes.</p>
      </div>
    `;
    
    await emailApi.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent successfully via Brevo');
    return true;
  } catch (error) {
    console.error('❌ Brevo email error:', error);
    throw error;
  }
}

async function sendSMSCode(phone, code) {
  // Log the code in development only
  if (dev) {
    console.log(`📱 SMS verification code for ${phone}: ${code}`);
  }
  
  // Skip actual SMS sending in dev mode
  if (devConfig.skipEmailSending) {
    console.log('🔧 Dev mode: Skipping SMS sending, code logged above');
    return true;
  }
  
  try {
    // TextBee SMS API integration
    const response = await fetch(`https://api.textbee.dev/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TEXTBEE_API_KEY,
      },
      body: JSON.stringify({
        recipients: [phone],
        message: `Your Aliquippa Keeper League verification code is: ${code}. This code will expire in 10 minutes.`
      })
    });

    if (!response.ok) {
      throw new Error(`TextBee API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ SMS sent successfully via TextBee:', result);
    return true;
  } catch (error) {
    console.error('❌ TextBee SMS error:', error);
    throw error;
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const { teamId, method, email, phone } = await request.json();
    
    if (!teamId || !method) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (method === 'email' && !email) {
      return json({ error: 'Email address required' }, { status: 400 });
    }

    if (method === 'sms' && !phone) {
      return json({ error: 'Phone number required' }, { status: 400 });
    }

    const code = generateVerificationCode();

    try {
      if (method === 'email') {
        await sendEmailCode(email, code);
      } else if (method === 'sms') {
        await sendSMSCode(phone, code);
      } else {
        return json({ error: 'Invalid method' }, { status: 400 });
      }

      const response = {
        success: true,
        message: `Verification code sent via ${method}`,
        maskedContact: method === 'email' ? maskEmail(email) : maskPhone(phone)
      };
      
      // Only include code in development mode
      if (dev || devConfig.showVerificationCodes) {
        response.code = code;
      }
      
      return json(response);
    } catch (error) {
      console.error(`Error sending ${method} code:`, error);
      return json({ error: `Failed to send ${method} code` }, { status: 500 });
    }
  } catch (error) {
    console.error('Send code API error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}