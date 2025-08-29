# Domain-Specific JavaScript Error Debugging Guide

This document provides comprehensive debugging instructions for resolving the "Cannot read properties of undefined (reading 'call')" error that occurs when accessing the site via domain but not local IP.

## Problem Summary

**Error**: `Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'call')`  
**Location**: `get_first_child (chunk-UZNQHCUQ.js:3520:29)`  
**Occurs**: Only when accessing via `bids.triplepoint.me`, not when using local IP address  

## Root Cause

The error is caused by **server-side data loading failures** when the external FastAPI server at `localhost:8000` is not accessible from the production environment. This creates a hydration mismatch between server-rendered content (empty data) and client-side expectations (populated data).

## Environment Configuration

### Required Environment Variable

Add to your `.env` file:

```bash
# For development (default if not set)
EXTERNAL_API_BASE=http://localhost:8000

# For production deployment
EXTERNAL_API_BASE=http://your-api-server:8000
```

### Production Deployment Options

Choose one of these approaches for production:

#### Option 1: External API Server
```bash
# Set to accessible API server
EXTERNAL_API_BASE=http://api.yourdomain.com:8000
```

#### Option 2: Same Host API
```bash
# If API runs on same server, different port
EXTERNAL_API_BASE=http://bids.triplepoint.me:8000
```

#### Option 3: Internal Docker Network
```bash
# If using Docker Compose
EXTERNAL_API_BASE=http://api-container:8000
```

## Debugging Steps

### 1. Enable Enhanced Logging

The application now includes comprehensive logging. Check browser console for:

- `[HOME-PAGE-LOAD]` - Home page data loading logs
- `[FREE-AGENTS-LOAD]` - Free agents page logs  
- `[BIDS-LOAD]` - Bids page data loading
- `[API REQUEST]` - External API call details
- `[JSON PARSE]` - Response parsing information
- `[CLIENT ERROR]` - Client-side error tracking
- `[LAYOUT]` - Global error handling

### 2. Check Server Logs

Look for these server-side log patterns:

```bash
# API connection issues
[API REQUEST] teams-fetch: Failed after XXXms
[API REQUEST] teams-fetch: Error: API request timeout

# Environment configuration
[API CONFIG] Environment: server
[API CONFIG] Using API base: http://localhost:8000
[API CONFIG] Current host: server-side
```

### 3. Verify API Accessibility

Test from your production server:

```bash
# Test if external API is accessible
curl -v http://localhost:8000/teams

# Check API response format
curl -s http://localhost:8000/teams | head -200
```

### 4. Browser Console Analysis

In browser developer tools, look for:

1. **Load Function Logs**: Check if data is being loaded properly
2. **Error Storage**: Check `localStorage.getItem('recentErrors')`
3. **Debug Info**: The app stores debug information automatically

```javascript
// In browser console, get debug information
JSON.parse(localStorage.getItem('recentErrors') || '[]')
```

### 5. Network Tab Analysis

Check Network tab for failed requests:
- Look for 500/timeout errors on server-side rendered pages
- Compare network requests between IP and domain access
- Check if external API calls are reaching the intended server

## Error Recovery Features

The application includes automatic error recovery:

1. **Automatic Cache Clearing**: Clears localStorage on target errors
2. **Service Worker Cleanup**: Removes cached resources
3. **Smart Reloading**: Attempts reload with cache busting
4. **Error Rate Limiting**: Prevents infinite reload loops

## Testing The Fix

### Local Testing
```bash
# Test with different API configurations
EXTERNAL_API_BASE=http://localhost:8000 npm run dev
EXTERNAL_API_BASE=http://192.168.1.100:8000 npm run dev
```

### Production Testing
1. Deploy with correct `EXTERNAL_API_BASE`
2. Access via domain: `https://bids.triplepoint.me`
3. Check browser console for logs
4. Verify data loads properly on all pages

### Comparison Testing
Access both URLs and compare:
- Local IP: `http://192.168.x.x:5173`
- Domain: `https://bids.triplepoint.me`

Look for differences in:
- Server load function success/failure
- API response times
- Data structure consistency

## Advanced Troubleshooting

### Check Load Context Data

Each page now returns `loadContext` with debugging information:

```javascript
// In browser console, check page data
$page.data.loadContext
```

This shows:
- Request host and protocol
- API call success/failure
- Data counts and timestamps
- Environment details

### Monitor Real-time Errors

The app stores recent errors in localStorage:

```javascript
// View recent errors
JSON.parse(localStorage.getItem('recentErrors') || '[]')
  .forEach((error, i) => {
    console.log(`Error ${i + 1}:`, error);
  });
```

### Network Environment Analysis

Check if the issue is network-related:

```bash
# From production server, test connectivity
telnet localhost 8000
ping localhost
curl -I http://localhost:8000/teams
```

## Solution Verification

After implementing the fixes, you should see:

1. **Consistent Behavior**: Same functionality on both IP and domain
2. **Comprehensive Logs**: Detailed logging in both browser and server consoles
3. **Graceful Degradation**: App works even if external API is unavailable
4. **Error Recovery**: Automatic recovery from transient issues

## Common Issues and Solutions

### Issue: API Still Uses localhost:8000
**Solution**: Verify `EXTERNAL_API_BASE` environment variable is set and restart server

### Issue: Errors Continue After Fix
**Solution**: Clear all browser cache and localStorage manually:
```javascript
// Clear everything
localStorage.clear();
sessionStorage.clear();
// Then reload page
```

### Issue: Service Worker Interference
**Solution**: Check for active service workers:
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Active service workers:', registrations.length);
  registrations.forEach(reg => reg.unregister());
});
```

## Contact and Support

If issues persist after following this guide:

1. Check browser console logs for specific error patterns
2. Collect server logs showing API connection attempts
3. Verify external API server is accessible from production environment
4. Test with different `EXTERNAL_API_BASE` configurations

The enhanced logging should provide detailed information about exactly where the failure occurs in the data loading pipeline.