import { writeFileSync, readFileSync, existsSync } from 'fs';
import path from 'path';

// File path for persistent bid window settings
const SETTINGS_FILE_PATH = path.join(process.cwd(), 'bid-window-settings.json');

// Default settings
const DEFAULT_SETTINGS = {
  closeDay: 3,  // Wednesday
  closeHour: 21, // 9 PM
  openDay: 0,   // Sunday
  openHour: 21  // 9 PM
};

/**
 * Load bid window settings from file
 * @returns {Object} Bid window settings
 */
export function loadBidWindowSettingsFromFile() {
  try {
    if (existsSync(SETTINGS_FILE_PATH)) {
      const fileContent = readFileSync(SETTINGS_FILE_PATH, 'utf8');
      const settings = JSON.parse(fileContent);
      console.log('Loaded bid window settings from file:', settings);
      return { ...DEFAULT_SETTINGS, ...settings };
    }
  } catch (error) {
    console.error('Error loading bid window settings from file:', error);
  }
  
  // Return default settings if file doesn't exist or there's an error
  console.log('Using default bid window settings:', DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

/**
 * Save bid window settings to file
 * @param {Object} settings - Settings to save
 */
export function saveBidWindowSettingsToFile(settings) {
  try {
    const settingsToSave = { ...DEFAULT_SETTINGS, ...settings };
    writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settingsToSave, null, 2));
    console.log('Saved bid window settings to file:', settingsToSave);
    return true;
  } catch (error) {
    console.error('Error saving bid window settings to file:', error);
    return false;
  }
}

/**
 * Get current bid window settings (server-side)
 * @returns {Object} Current settings
 */
export function getServerBidWindowSettings() {
  return loadBidWindowSettingsFromFile();
}