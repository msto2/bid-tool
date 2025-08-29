// API Configuration with environment detection and logging
import { browser } from '$app/environment';
import { env } from '$env/dynamic/private';

/**
 * Get the appropriate API base URL based on environment
 * @returns {string} The API base URL
 */
export function getApiBaseUrl() {
  // In production, try to use the same host as the current request
  const apiBase = env?.EXTERNAL_API_BASE || 'http://localhost:8000';
  
  console.log(`[API CONFIG] Environment: ${browser ? 'browser' : 'server'}`);
  console.log(`[API CONFIG] Using API base: ${apiBase}`);
  console.log(`[API CONFIG] Current host: ${browser ? window.location.host : 'server-side'}`);
  
  return apiBase;
}

/**
 * Enhanced fetch with comprehensive logging and error handling
 * @param {string} url - The URL to fetch
 * @param {RequestInit} options - Fetch options
 * @param {string} context - Context for logging (e.g., 'teams', 'free-agents')
 * @returns {Promise<Response>}
 */
export async function apiRequest(url, options = {}, context = 'unknown') {
  const startTime = Date.now();
  const fullUrl = url.startsWith('http') ? url : `${getApiBaseUrl()}${url}`;
  
  console.log(`[API REQUEST] ${context}: Starting request to ${fullUrl}`);
  console.log(`[API REQUEST] ${context}: Options:`, JSON.stringify(options, null, 2));
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`[API REQUEST] ${context}: Request timeout after 10 seconds`);
      controller.abort();
    }, 10000); // 10 second timeout
    
    const response = await fetch(fullUrl, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    console.log(`[API REQUEST] ${context}: Response received in ${duration}ms`);
    console.log(`[API REQUEST] ${context}: Status: ${response.status} ${response.statusText}`);
    console.log(`[API REQUEST] ${context}: Headers:`, [...response.headers.entries()]);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API REQUEST] ${context}: Error response body:`, errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return response;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API REQUEST] ${context}: Failed after ${duration}ms`);
    console.error(`[API REQUEST] ${context}: Error:`, error);
    
    if (error.name === 'AbortError') {
      throw new Error(`API request timeout: ${fullUrl}`);
    }
    
    throw error;
  }
}

/**
 * Parse JSON response with error handling and logging
 * @param {Response} response - The response to parse
 * @param {string} context - Context for logging
 * @returns {Promise<any>}
 */
export async function parseJsonResponse(response, context = 'unknown') {
  try {
    const text = await response.text();
    console.log(`[JSON PARSE] ${context}: Response text length: ${text.length}`);
    console.log(`[JSON PARSE] ${context}: First 200 chars:`, text.substring(0, 200));
    
    if (!text) {
      console.warn(`[JSON PARSE] ${context}: Empty response body`);
      return null;
    }
    
    const json = JSON.parse(text);
    console.log(`[JSON PARSE] ${context}: Successfully parsed JSON`);
    console.log(`[JSON PARSE] ${context}: Data type:`, typeof json);
    console.log(`[JSON PARSE] ${context}: Data preview:`, Array.isArray(json) ? `Array with ${json.length} items` : JSON.stringify(json).substring(0, 200));
    
    return json;
    
  } catch (error) {
    console.error(`[JSON PARSE] ${context}: Failed to parse JSON:`, error);
    console.error(`[JSON PARSE] ${context}: Response status:`, response.status);
    throw new Error(`Failed to parse JSON response: ${error.message}`);
  }
}