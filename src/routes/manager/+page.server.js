import { redirect } from '@sveltejs/kit';
import { CONTACTS } from '$env/static/private';

/** @type {import('./$types').PageServerLoad} */
export async function load({ url, request }) {
  // Check if this is a POST request for authentication
  const authEmail = url.searchParams.get('email');
  
  // Load contacts data
  let contacts = {};
  try {
    contacts = JSON.parse(CONTACTS);
  } catch (error) {
    console.error('Error parsing contacts:', error);
  }
  
  // For now, we'll handle authentication client-side since we need email/SMS integration
  // In a production environment, you might want server-side verification
  
  return {
    authenticated: false, // Will be handled client-side
    managerEmail: 'michael.stokes.212@gmail.com',
    contacts
  };
}

/** @type {import('./$types').Actions} */
export const actions = {
  authenticate: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email');
    const code = data.get('code');
    
    // This would typically verify the code sent via email/SMS
    // For now, we'll rely on client-side verification
    
    if (email === 'michael.stokes.212@gmail.com') {
      return {
        success: true,
        message: 'Authentication successful'
      };
    }
    
    return {
      success: false,
      message: 'Access denied'
    };
  }
};