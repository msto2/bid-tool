/**
 * Server-side bid window settings storage utilities
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

// Default settings (can be overridden by manager)
const DEFAULT_SETTINGS = {
  closeDay: 3, // Wednesday (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  closeHour: 21, // 9 PM
  openDay: 0, // Sunday
  openHour: 21 // 9 PM
};

// File path for persistent settings storage
const SETTINGS_FILE_PATH = path.join(process.cwd(), 'bidWindowSettings.json');

/**
 * Load bid window settings from file
 * @returns {Object} Current settings
 */
export function loadBidWindowSettingsFromFile() {
  try {
    if (existsSync(SETTINGS_FILE_PATH)) {
      const fileContent = readFileSync(SETTINGS_FILE_PATH, 'utf8');
      const settings = JSON.parse(fileContent);
      return { ...DEFAULT_SETTINGS, ...settings };
    }
  } catch (error) {
    console.error('Error loading bid window settings from file:', error);
  }
  
  return { ...DEFAULT_SETTINGS };
}

/**
 * Save bid window settings to file
 * @param {Object} settings - Settings to save
 */
export function saveBidWindowSettingsToFile(settings) {
  try {
    const settingsToSave = { ...DEFAULT_SETTINGS, ...settings };
    writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settingsToSave, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving bid window settings to file:', error);
    throw error;
  }
}

/**
 * Get current bid window settings
 * @returns {Object} Current settings
 */
export function getBidWindowSettings() {
  return loadBidWindowSettingsFromFile();
}

/**
 * Update bid window settings
 * @param {Object} newSettings - New settings to merge
 * @returns {Object} Updated settings
 */
export function updateBidWindowSettings(newSettings) {
  const currentSettings = loadBidWindowSettingsFromFile();
  const updatedSettings = { ...currentSettings, ...newSettings };
  saveBidWindowSettingsToFile(updatedSettings);
  return updatedSettings;
}