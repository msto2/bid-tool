import { json } from '@sveltejs/kit';
import { getBidWindowSettings } from '$lib/bidWindow.js';
import { loadBidWindowSettingsFromFile, saveBidWindowSettingsToFile } from '$lib/server/bidWindowStorage.js';

const MANAGER_EMAIL = 'michael.stokes.212@gmail.com';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  // Get current bid window settings from server file
  try {
    const settings = loadBidWindowSettingsFromFile();
    return json({
      success: true,
      settings,
      dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      hours: Array.from({ length: 24 }, (_, i) => ({
        value: i,
        label: i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`
      }))
    });
  } catch (error) {
    console.error('Error getting bid window settings:', error);
    return json({ success: false, error: 'Failed to get settings' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const body = await request.json();
    const { email, settings } = body;
    
    // Verify manager email
    if (email !== MANAGER_EMAIL) {
      return json({ 
        success: false, 
        error: 'Unauthorized: Manager access required' 
      }, { status: 403 });
    }
    
    // Validate settings
    if (!settings || typeof settings !== 'object') {
      return json({ 
        success: false, 
        error: 'Invalid settings data' 
      }, { status: 400 });
    }
    
    // Validate individual settings
    const { closeDay, closeHour, openDay, openHour } = settings;
    
    if (closeDay < 0 || closeDay > 6 || openDay < 0 || openDay > 6) {
      return json({ 
        success: false, 
        error: 'Invalid day values. Must be 0-6 (Sunday-Saturday)' 
      }, { status: 400 });
    }
    
    if (closeHour < 0 || closeHour > 23 || openHour < 0 || openHour > 23) {
      return json({ 
        success: false, 
        error: 'Invalid hour values. Must be 0-23' 
      }, { status: 400 });
    }
    
    // Save settings to server file
    const saved = saveBidWindowSettingsToFile(settings);
    
    if (!saved) {
      return json({ 
        success: false, 
        error: 'Failed to save settings to server' 
      }, { status: 500 });
    }
    
    console.log(`Manager ${email} updated bid window settings:`, settings);
    
    return json({
      success: true,
      message: 'Settings updated successfully',
      settings
    });
    
  } catch (error) {
    console.error('Error updating bid window settings:', error);
    return json({ success: false, error: 'Failed to update settings' }, { status: 500 });
  }
}