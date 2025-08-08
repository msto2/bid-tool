import { json } from '@sveltejs/kit';

// In development, we'll generate simple codes
// In production, you would integrate with services like:
// - Twilio for SMS
// - SendGrid, Mailgun, or similar for email

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
  // In development, just log the code
  console.log(`📧 Email verification code for ${email}: ${code}`);
  
  // In production, you would use an email service like SendGrid:
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const msg = {
    to: email,
    from: 'noreply@yourapp.com',
    subject: 'Fantasy League Verification Code',
    text: `Your verification code is: ${code}`,
    html: `<strong>Your verification code is: ${code}</strong>`,
  };
  
  await sgMail.send(msg);
  */
  
  return true;
}

async function sendSMSCode(phone, code) {
  // In development, just log the code
  console.log(`📱 SMS verification code for ${phone}: ${code}`);
  
  // In production, you would use a service like Twilio:
  /*
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  
  await client.messages.create({
    body: `Your fantasy league verification code is: ${code}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  });
  */
  
  return true;
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

      return json({
        success: true,
        code, // In development, return the code. In production, remove this!
        message: `Verification code sent via ${method}`,
        maskedContact: method === 'email' ? maskEmail(email) : maskPhone(phone)
      });
    } catch (error) {
      console.error(`Error sending ${method} code:`, error);
      return json({ error: `Failed to send ${method} code` }, { status: 500 });
    }
  } catch (error) {
    console.error('Send code API error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}