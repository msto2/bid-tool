import { json } from '@sveltejs/kit';
import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';
import { BREVO_API_KEY } from '$env/static/private';
import { dev } from '$app/environment';
import { devConfig } from '$lib/devMode.js';

// Initialize Brevo API
const emailApi = new TransactionalEmailsApi();
emailApi.authentications.apiKey.apiKey = BREVO_API_KEY;

const MANAGER_EMAIL = 'michael.stokes.212@gmail.com';

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function maskEmail(email) {
  const [local, domain] = email.split('@');
  const maskedLocal = local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1);
  return `${maskedLocal}@${domain}`;
}

async function sendManagerEmailCode(email, code) {
  // Log the code in development only
  if (devConfig) {
    console.log(`📧 Manager verification code for ${email}: ${code}`);
  }
  
  // Skip actual email sending in dev mode
  if (devConfig.skipEmailSending) {
    console.log('🔧 Dev mode: Skipping manager email sending, code logged above');
    return true;
  }
  
  try {
    const sendSmtpEmail = new SendSmtpEmail();
    
    sendSmtpEmail.subject = 'Manager Panel Verification Code';
    sendSmtpEmail.sender = { name: 'Aliquippa Keeper League', email: 'admin@triplepoint.me' };
    sendSmtpEmail.to = [{ email: email }];
    sendSmtpEmail.textContent = `Your manager panel verification code is: ${code}`;
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #f59e0b;">Manager Panel Access</h2>
        <p>Your verification code for the Manager Panel is:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${code}</span>
        </div>
        <p style="color: #6b7280;">Enter this code to access the management dashboard.</p>
        <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes.</p>
        <div style="margin-top: 30px; padding: 15px; background: #fef3c7; border-radius: 8px;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            <strong>Security Notice:</strong> This is a restricted management area. 
            If you did not request this code, please ignore this email.
          </p>
        </div>
      </div>
    `;
    
    const result = await emailApi.sendTransacEmail(sendSmtpEmail);
    
    if (dev) {
      console.log('✅ Manager email sent successfully via Brevo');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Brevo manager email error:', error);
    throw error;
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return json({ error: 'Email address required' }, { status: 400 });
    }

    // Verify this is the authorized manager email (skip in dev mode)
    if (!devConfig.allowAnyManagerEmail && email !== MANAGER_EMAIL) {
      return json({ error: 'Access denied: Manager privileges required' }, { status: 403 });
    }

    const code = generateVerificationCode();

    try {
      await sendManagerEmailCode(email, code);

      const response = {
        success: true,
        message: 'Manager verification code sent',
        maskedContact: maskEmail(email)
      };
      
      // Only include code in development mode
      if (dev || devConfig.showVerificationCodes) {
        response.code = code;
      }
      
      return json(response);
    } catch (error) {
      console.error('Error sending manager verification code:', error);
      return json({ error: 'Failed to send verification code' }, { status: 500 });
    }
  } catch (error) {
    console.error('Manager auth API error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}