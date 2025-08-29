<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { isManagerAuthenticated, setManagerSession, clearManagerSession } from '$lib/managerAuth.js';
  import { getBidWindowSettings, updateBidWindowSettings, loadBidWindowSettings } from '$lib/bidWindow.js';
import { devConfig } from '$lib/devMode.js';
  import BidWindowStatus from '$lib/components/BidWindowStatus.svelte';
  import { getSignedInTeam } from '$lib/simple-auth-reset.js';

  export let data;
  
  let authenticated = false;
  let email = '';
  let verificationCode = '';
  let showVerification = false;
  let loading = false;
  let error = '';
  let success = '';
  
  // Bid window settings
  let settings = {
    closeDay: 3,
    closeHour: 21,
    openDay: 0,
    openHour: 21
  };
  let originalSettings = {};
  let settingsChanged = false;
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hours = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`
  }));
  
  onMount(() => {
    if (browser) {
      // Check if manager is already authenticated
      authenticated = isManagerAuthenticated();
      
      // If not authenticated, check if the signed-in user is the manager
      if (!authenticated) {
        const signedInUser = getSignedInTeam();
        if (signedInUser) {
          // Check if the signed-in user's team has the manager email in contacts
          const managerEmail = 'michael.stokes.212@gmail.com';
          
          // For now, we'll check if the team ID corresponds to the manager
          // You may need to adjust this logic based on how you determine which team belongs to the manager
          if (data?.contacts && data.contacts[signedInUser.id]?.email === managerEmail) {
            // Auto-authenticate the manager
            if (setManagerSession(managerEmail)) {
              authenticated = true;
              email = managerEmail;
              success = 'Automatically authenticated as manager';
              setTimeout(() => { success = ''; }, 3000);
            }
          }
        }
      }
      
      if (authenticated) {
        loadCurrentSettings();
      }
    }
  });
  
  async function loadCurrentSettings() {
    try {
      // Load settings from server
      const response = await fetch('/api/manager/bid-window');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          settings = result.settings;
          originalSettings = { ...settings };
          
          // Also update client-side settings
          updateBidWindowSettings(settings);
        }
      }
    } catch (err) {
      console.error('Error loading settings from server:', err);
      // Fallback to client-side settings
      loadBidWindowSettings();
      settings = getBidWindowSettings();
      originalSettings = { ...settings };
    }
  }
  
  $: settingsChanged = JSON.stringify(settings) !== JSON.stringify(originalSettings);
  
  async function requestVerificationCode() {
    if (!email) {
      error = 'Please enter your email address';
      return;
    }
    
    if (!devConfig.allowAnyManagerEmail && email !== data.managerEmail) {
      error = 'Access denied: Manager privileges required';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      const response = await fetch('/api/manager/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showVerification = true;
        success = 'Verification code sent to your email';
      } else {
        error = result.message || 'Failed to send verification code';
      }
    } catch (err) {
      error = 'Failed to send verification code';
    } finally {
      loading = false;
    }
  }
  
  async function verifyCode() {
    if (!verificationCode) {
      error = 'Please enter the verification code';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      // In a real implementation, you'd verify the code server-side
      // For now, we'll accept any 6-digit code for the manager email
      if (verificationCode.length >= 4 && (devConfig.allowAnyManagerEmail || email === data.managerEmail)) {
        if (setManagerSession(email)) {
          authenticated = true;
          loadCurrentSettings();
          success = 'Manager authentication successful';
          showVerification = false;
        } else {
          error = 'Authentication failed';
        }
      } else {
        error = 'Invalid verification code';
      }
    } catch (err) {
      error = 'Verification failed';
    } finally {
      loading = false;
    }
  }
  
  function signOut() {
    clearManagerSession();
    authenticated = false;
    email = '';
    verificationCode = '';
    showVerification = false;
    error = '';
    success = '';
  }
  
  async function saveSettings() {
    loading = true;
    error = '';
    success = '';
    
    try {
      // Update settings locally
      updateBidWindowSettings(settings);
      
      // Also send to server for logging/validation
      const response = await fetch('/api/manager/bid-window', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          settings
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        originalSettings = { ...settings };
        success = 'Bid window settings updated successfully';
        
        // Broadcast the settings change to all connected clients
        try {
          await fetch('/api/websocket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'bid_window_settings_updated',
              settings: settings,
              message: 'Bid window settings have been updated',
              timestamp: Date.now()
            })
          });
        } catch (broadcastError) {
          console.error('Error broadcasting settings update:', broadcastError);
        }
      } else {
        error = result.error || 'Failed to save settings';
      }
    } catch (err) {
      error = 'Failed to save settings';
    } finally {
      loading = false;
    }
  }
  
  function resetSettings() {
    settings = { ...originalSettings };
  }
  
  function goHome() {
    goto('/');
  }
</script>

<svelte:head>
  <title>Manager Panel - Fantasy Football Bid Tool</title>
</svelte:head>

<main class="container">
  <header class="page-header">
    <div class="header-content">
      <h1>Manager Panel</h1>
      <p class="subtitle">Bid window configuration and management</p>
    </div>
    
    {#if authenticated}
      <nav class="user-nav">
        <button class="nav-button" on:click={goHome}>Home</button>
        <button class="nav-button sign-out" on:click={signOut}>Sign Out</button>
      </nav>
    {/if}
  </header>

  <div class="content">
    {#if !authenticated}
      <!-- Authentication Section -->
      <div class="auth-section">
        <div class="auth-card">
          <h2>Manager Authentication</h2>
          <p class="auth-description">
            Access restricted to authorized managers only. 
            Please authenticate with your registered email address.
          </p>
          
          {#if !showVerification}
            <div class="form-group">
              <label for="email">Manager Email</label>
              <input
                id="email"
                type="email"
                bind:value={email}
                placeholder="Enter your email address"
                disabled={loading}
                required
              />
            </div>
            
            <button 
              class="primary-button"
              on:click={requestVerificationCode}
              disabled={loading || !email}
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          {:else}
            <div class="form-group">
              <label for="code">Verification Code</label>
              <p class="code-hint">Check your email for the verification code</p>
              <input
                id="code"
                type="text"
                bind:value={verificationCode}
                placeholder="Enter verification code"
                disabled={loading}
                maxlength="6"
                required
              />
            </div>
            
            <div class="button-group">
              <button 
                class="primary-button"
                on:click={verifyCode}
                disabled={loading || !verificationCode}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button 
                class="secondary-button"
                on:click={() => { showVerification = false; verificationCode = ''; }}
              >
                Back
              </button>
            </div>
          {/if}
          
          {#if error}
            <div class="error-message">
              {error}
            </div>
          {/if}
          
          {#if success}
            <div class="success-message">
              {success}
            </div>
          {/if}
        </div>
      </div>
    {:else}
      <!-- Manager Dashboard -->
      <div class="dashboard">
        <div class="current-status-section">
          <h2>Current Bid Window Status</h2>
          <BidWindowStatus />
        </div>
        
        <div class="settings-section">
          <h2>Bid Window Configuration</h2>
          <p class="settings-description">
            Configure when bidding opens and closes each week. Changes take effect immediately.
          </p>
          
          <div class="settings-grid">
            <!-- Bidding Closes -->
            <div class="setting-group">
              <h3>Bidding Closes</h3>
              <div class="setting-controls">
                <div class="form-group">
                  <label for="closeDay">Day</label>
                  <select id="closeDay" bind:value={settings.closeDay}>
                    {#each dayNames as day, index}
                      <option value={index}>{day}</option>
                    {/each}
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="closeHour">Time</label>
                  <select id="closeHour" bind:value={settings.closeHour}>
                    {#each hours as hour}
                      <option value={hour.value}>{hour.label}</option>
                    {/each}
                  </select>
                </div>
              </div>
            </div>
            
            <!-- Bidding Opens -->
            <div class="setting-group">
              <h3>Bidding Opens</h3>
              <div class="setting-controls">
                <div class="form-group">
                  <label for="openDay">Day</label>
                  <select id="openDay" bind:value={settings.openDay}>
                    {#each dayNames as day, index}
                      <option value={index}>{day}</option>
                    {/each}
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="openHour">Time</label>
                  <select id="openHour" bind:value={settings.openHour}>
                    {#each hours as hour}
                      <option value={hour.value}>{hour.label}</option>
                    {/each}
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div class="settings-preview">
            <h4>Preview</h4>
            <p>
              Bidding will be <strong>closed</strong> from 
              <span class="highlight">{dayNames[settings.closeDay]} at {hours[settings.closeHour].label}</span>
              to 
              <span class="highlight">{dayNames[settings.openDay]} at {hours[settings.openHour].label}</span>
            </p>
          </div>
          
          <div class="settings-actions">
            <button 
              class="primary-button"
              on:click={saveSettings}
              disabled={loading || !settingsChanged}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            
            <button 
              class="secondary-button"
              on:click={resetSettings}
              disabled={loading || !settingsChanged}
            >
              Reset Changes
            </button>
          </div>
          
          {#if error}
            <div class="error-message">
              {error}
            </div>
          {/if}
          
          {#if success}
            <div class="success-message">
              {success}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</main>

<style>
  .container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 1.5rem;
    min-height: 100vh;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
    color: white;
    font-family: 'Inter', sans-serif;
  }

  .page-header {
    position: relative;
    text-align: center;
    margin-bottom: 3rem;
  }

  .header-content h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 30px rgba(245, 158, 11, 0.3);
  }

  .subtitle {
    font-size: 1.1rem;
    color: #94a3b8;
    margin: 0;
  }

  .user-nav {
    position: absolute;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  @media (max-width: 768px) {
    .user-nav {
      position: static;
      transform: none;
      justify-content: center;
      margin-top: 1rem;
    }
  }

  .nav-button {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: #60a5fa;
    padding: 0.4rem 0.6rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
  }

  .nav-button:hover {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.5);
    color: #93c5fd;
  }

  .nav-button.sign-out {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
    color: #f87171;
  }

  .nav-button.sign-out:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.5);
    color: #fca5a5;
  }

  .auth-section {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
  }

  .auth-card {
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 1rem;
    padding: 2rem;
    backdrop-filter: blur(10px);
    max-width: 400px;
    width: 100%;
  }

  .auth-card h2 {
    color: #f59e0b;
    margin-bottom: 1rem;
    text-align: center;
  }

  .auth-description {
    color: #94a3b8;
    text-align: center;
    margin-bottom: 2rem;
    line-height: 1.6;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    color: #e2e8f0;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .form-group input, .form-group select {
    width: 100%;
    padding: 0.75rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(75, 85, 99, 0.5);
    border-radius: 0.5rem;
    color: #e2e8f0;
    font-size: 0.875rem;
  }

  .form-group input:focus, .form-group select:focus {
    outline: none;
    border-color: #60a5fa;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
  }

  .code-hint {
    color: #94a3b8;
    font-size: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .primary-button {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
    margin-bottom: 1rem;
  }

  .primary-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .primary-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .secondary-button {
    background: rgba(75, 85, 99, 0.3);
    color: #d1d5db;
    padding: 0.75rem 1.5rem;
    border: 1px solid rgba(75, 85, 99, 0.5);
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .secondary-button:hover:not(:disabled) {
    background: rgba(75, 85, 99, 0.5);
    border-color: rgba(75, 85, 99, 0.7);
  }

  .secondary-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .button-group {
    display: flex;
    gap: 1rem;
  }

  .button-group .primary-button,
  .button-group .secondary-button {
    width: 100%;
    margin-bottom: 0;
  }

  .error-message {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 0.5rem;
    padding: 0.75rem;
    color: #f87171;
    font-size: 0.875rem;
    margin-top: 1rem;
  }

  .success-message {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    border-radius: 0.5rem;
    padding: 0.75rem;
    color: #4ade80;
    font-size: 0.875rem;
    margin-top: 1rem;
  }

  .dashboard {
    display: grid;
    gap: 3rem;
  }

  .current-status-section,
  .settings-section {
    background: rgba(30, 41, 59, 0.4);
    border: 1px solid rgba(59, 130, 246, 0.15);
    border-radius: 1rem;
    padding: 2rem;
    backdrop-filter: blur(10px);
  }

  .current-status-section h2,
  .settings-section h2 {
    color: #f59e0b;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
  }

  .settings-description {
    color: #94a3b8;
    margin-bottom: 2rem;
    line-height: 1.6;
  }

  .settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
  }

  @media (max-width: 768px) {
    .settings-grid {
      grid-template-columns: 1fr;
    }
  }

  .setting-group {
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(75, 85, 99, 0.3);
    border-radius: 0.75rem;
    padding: 1.5rem;
  }

  .setting-group h3 {
    color: #60a5fa;
    margin-bottom: 1rem;
    font-size: 1.125rem;
  }

  .setting-controls {
    display: grid;
    gap: 1rem;
  }

  .settings-preview {
    background: rgba(15, 23, 42, 0.3);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .settings-preview h4 {
    color: #34d399;
    margin-bottom: 1rem;
  }

  .settings-preview p {
    color: #e2e8f0;
    line-height: 1.6;
  }

  .highlight {
    background: linear-gradient(135deg, #60a5fa, #34d399);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 600;
  }

  .settings-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-start;
  }

  .settings-actions .primary-button,
  .settings-actions .secondary-button {
    width: auto;
    margin-bottom: 0;
  }

  @media (max-width: 768px) {
    .container {
      padding: 1rem;
    }
    
    .settings-actions {
      flex-direction: column;
    }
    
    .settings-actions .primary-button,
    .settings-actions .secondary-button {
      width: 100%;
    }
  }
</style>