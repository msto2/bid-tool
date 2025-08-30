import { json } from '@sveltejs/kit';
import { devConfig } from '$lib/devMode.js';

const MANAGER_EMAIL = 'michael.stokes.212@gmail.com';

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

    // Use the shared send-code API endpoint
    const sendCodeResponse = await fetch(`${request.url.origin}/api/send-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teamId: 'manager', // Special team ID for manager
        method: 'email',
        email: email
      })
    });

    if (!sendCodeResponse.ok) {
      const errorData = await sendCodeResponse.json();
      return json({ error: errorData.error || 'Failed to send verification code' }, { status: sendCodeResponse.status });
    }

    const result = await sendCodeResponse.json();
    
    // Return manager-specific response format
    return json({
      success: true,
      message: 'Manager verification code sent',
      maskedContact: result.maskedContact,
      code: result.code // This will include the code based on the send-code API logic
    });
    
  } catch (error) {
    console.error('Manager auth API error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}