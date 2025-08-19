<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { contacts } from '$lib/data/contacts.js';
  import { isSessionValidForDeployment, clearInvalidSession, createSessionData, forceSessionReset } from '$lib/deployment.js';

  export let data;
  const { teams } = data;

  let showSignInModal = false;
  let selectedTeam = null;
  let signInStep = 'choose'; // 'choose', 'code', 'success'
  let authMethod = 'email'; // 'email' or 'sms'
  let verificationCode = '';
  let inputCode = '';
  let isLoading = false;
  let errorMessage = '';

  let signedInTeam = null;

  onMount(() => {
    // Check if user is already signed in with valid deployment session
    if (browser) {
      try {
        const savedTeam = localStorage.getItem('signedInTeam');
        
        if (savedTeam && isSessionValidForDeployment(savedTeam)) {
          try {
            const teamData = JSON.parse(savedTeam);
            // Double-check the parsed data is valid
            if (teamData && teamData.id && teamData.name && teamData.deploymentVersion) {
              signedInTeam = teamData;
            } else {
              console.log('Invalid team data structure after parsing');
              forceSessionReset();
            }
          } catch (parseError) {
            console.log('Error parsing saved team data:', parseError);
            forceSessionReset();
          }
        } else {
          // Session is invalid (old deployment or expired), clear it
          console.log('Session validation failed, clearing...');
          forceSessionReset();
        }
      } catch (error) {
        console.log('Error in session check:', error);
        forceSessionReset();
      }
    }
  });

  function handleTeamClick(team) {
    selectedTeam = team;
    showSignInModal = true;
    signInStep = 'choose';
    errorMessage = '';
  }

  function closeModal() {
    showSignInModal = false;
    selectedTeam = null;
    signInStep = 'choose';
    authMethod = 'email';
    verificationCode = '';
    inputCode = '';
    errorMessage = '';
    isLoading = false;
  }

  async function sendVerificationCode() {
    if (!selectedTeam || !contacts[selectedTeam.id]) {
      errorMessage = 'Team contact information not found';
      return;
    }

    isLoading = true;
    errorMessage = '';

    try {
      const contact = contacts[selectedTeam.id];
      const response = await fetch('/api/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: selectedTeam.id,
          method: authMethod,
          email: contact.email,
          phone: contact.phone
        })
      });

      const result = await response.json();

      if (response.ok) {
        verificationCode = result.code; // In development, show the code
        signInStep = 'code';
      } else {
        errorMessage = result.error || 'Failed to send verification code';
      }
    } catch (error) {
      errorMessage = 'Network error. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  async function verifyCode() {
    if (inputCode !== verificationCode) {
      errorMessage = 'Invalid verification code';
      return;
    }

    // Store authentication in localStorage with deployment version
    if (browser) {
      const sessionData = createSessionData(selectedTeam.id, selectedTeam.team_name);
      localStorage.setItem('signedInTeam', JSON.stringify(sessionData));
    }

    signInStep = 'success';
    
    // Redirect after a brief delay
    setTimeout(() => {
      goto('/free-agents');
    }, 1500);
  }

  function handleSignOut() {
    if (browser) {
      forceSessionReset();
      signedInTeam = null;
    }
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      if (signInStep === 'choose') {
        sendVerificationCode();
      } else if (signInStep === 'code') {
        verifyCode();
      }
    }
  }
</script>

<style>
  :global(body) {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    margin: 0;
    padding: 0;
    color: #e2e8f0;
    min-height: 100vh;
    font-size: 14px;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .header {
    margin-bottom: 3rem;
    position: relative;
  }

  .header-content {
    text-align: center;
  }

  .user-info {
    position: absolute;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(30, 41, 59, 0.8);
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    font-size: 0.8rem;
  }

  .team-name {
    color: #f1f5f9;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .nav-btn {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: #3b82f6;
    padding: 0.4rem 0.6rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    display: inline-block;
  }

  .nav-btn:hover {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.5);
  }

  .footer {
    margin-top: 4rem;
    padding: 1rem 0;
    border-top: 1px solid rgba(148, 163, 184, 0.1);
    display: flex;
    justify-content: flex-end;
  }

  .sign-out-btn {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .sign-out-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.5);
  }

  .main-title {
    font-size: 2.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, #194285, #06b6d4, #10b981);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.5rem;
    text-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
  }

  .subtitle {
    color: #94a3b8;
    font-size: 1.1rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .league-info {
    color: #64748b;
    font-size: 0.9rem;
  }

  .teams-grid {
    display: grid;
    /* grid-template-columns: 1fr 1fr; */
    grid-template-columns: repeat(2, minmax(100px, .5fr));
    gap: 1.5rem;
    margin-top: 2rem;
  }

  .team-card {
    background: rgba(30, 41, 59, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 16px;
    padding: 1.5rem;
    position: relative;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .team-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.4);
  }

  .team-header {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .team-name.card-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f1f5f9;
    margin-bottom: 0.5rem;
  }

  .team-record {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
  }

  .record-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(15, 23, 42, 0.6);
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    min-width: 50px;
  }

  .record-label {
    font-size: 0.7rem;
    color: #94a3b8;
    margin-bottom: 0.25rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .record-value {
    font-size: 1.1rem;
    font-weight: 700;
    color:#10b981;
  }

  .wins {
    color: #10b981;
  }

  .losses {
    color: #ef4444;
  }

  .sign-in-btn {
    background: linear-gradient(135deg, #3b82f6, #06b6d4);
    border: none;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .sign-in-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(59, 130, 246, 0.4);
    background: linear-gradient(135deg, #2563eb, #0891b2);
  }

  .sign-in-btn:active {
    transform: translateY(0);
  }

  .no-teams {
    text-align: center;
    color: #94a3b8;
    font-size: 1.1rem;
    margin-top: 3rem;
    padding: 2rem;
    background: rgba(30, 41, 59, 0.5);
    border-radius: 12px;
    border: 1px solid rgba(148, 163, 184, 0.2);
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease;
  }

  .modal {
    background: rgba(30, 41, 59, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(148, 163, 184, 0.3);
    border-radius: 16px;
    padding: 2rem;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    animation: slideUp 0.3s ease;
  }

  .modal-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .modal-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #f1f5f9;
    margin-bottom: 0.5rem;
  }

  .modal-subtitle {
    color: #94a3b8;
    font-size: 0.9rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: #e2e8f0;
    margin-bottom: 0.5rem;
  }

  .auth-method-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .auth-method-btn {
    padding: 0.75rem 1rem;
    border: 1px solid rgba(148, 163, 184, 0.3);
    border-radius: 8px;
    background: rgba(15, 23, 42, 0.6);
    color: #94a3b8;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .auth-method-btn.active {
    background: linear-gradient(135deg, #3b82f6, #06b6d4);
    color: white;
    border-color: #3b82f6;
  }

  .auth-method-btn:hover:not(.active) {
    background: rgba(15, 23, 42, 0.8);
    border-color: rgba(148, 163, 184, 0.5);
  }

  .form-input {
    width: 100%;
    padding: 0.75rem;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(148, 163, 184, 0.3);
    border-radius: 6px;
    color: #e2e8f0;
    font-size: 0.9rem;
    transition: all 0.2s ease;
    text-align: center;
    font-family: monospace;
    letter-spacing: 0.5rem;
  }

  .form-input:focus {
    outline: none;
    border-color: #06b6d4;
    box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
  }

  .modal-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    margin-top: 2rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: linear-gradient(135deg, #3b82f6, #06b6d4);
    color: white;
    box-shadow: 0 3px 12px rgba(59, 130, 246, 0.3);
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 5px 16px rgba(59, 130, 246, 0.4);
  }

  .btn-secondary {
    background: rgba(148, 163, 184, 0.2);
    color: #94a3b8;
    border: 1px solid rgba(148, 163, 184, 0.3);
  }

  .btn-secondary:hover {
    background: rgba(148, 163, 184, 0.3);
    color: #e2e8f0;
  }

  .error-message {
    color: #ef4444;
    font-size: 0.8rem;
    margin-top: 0.5rem;
    text-align: center;
  }

  .success-message {
    text-align: center;
    color: #10b981;
  }

  .success-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .dev-code {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 6px;
    padding: 0.75rem;
    margin: 1rem 0;
    text-align: center;
    font-family: monospace;
    font-size: 1.2rem;
    letter-spacing: 0.2rem;
    color: #3b82f6;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { 
      opacity: 0; 
      transform: translateY(20px) scale(0.95); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0) scale(1); 
    }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Mobile optimizations */
  @media (max-width: 640px) {
    .container {
      padding: 1rem;
    }

    .main-title {
      font-size: 2rem;
    }

    .user-info {
      position: static;
      justify-content: center;
      margin-bottom: 1rem;
      transform: none;
      flex-wrap: wrap;
    }

    .header {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .footer {
      justify-content: center;
    }

    .teams-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .team-card {
      padding: 1.25rem;
    }

    .team-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .sign-in-btn {
      width: 100%;
      padding: 1rem;
    }

    .modal {
      margin: 1rem;
      max-width: none;
      width: calc(100% - 2rem);
    }

    .auth-method-buttons {
      grid-template-columns: 1fr;
    }
  }
</style>

<div class="container">
  <div class="header">
    {#if signedInTeam}
      <div class="user-info">
        <a href="/free-agents" class="nav-btn" data-sveltekit-preload-data="hover">
          Free Agents
        </a>
        <a href="/bids" class="nav-btn" data-sveltekit-preload-data="hover">
          Bids
        </a>
      </div>
    {/if}
    <div class="header-content">
      <h1 class="main-title">Aliquippa Keeper League</h1>
      <p class="subtitle">Choose your team to get started</p>
      <p class="league-info">League ID: 3925 • Season: 2025</p>
    </div>
  </div>
  

  {#if teams && teams.length > 0}
    <div class="teams-grid">
      {#each teams as team}
        <button class="team-card" on:click={() => handleTeamClick(team)}>
          <div class="team-header">
            <div>
              <h2 class="team-name card-title">{team.team_name}</h2>
              <div class="team-record">
                <div class="record-item">
                  <div class="record-label">Record</div>
                  <div class="record-value">{team.wins}-{team.losses}</div>
                </div>
                <div class="record-item">
                  <div class="record-label">Points</div>
                  <div class="record-value wins">{team.points_for ?? 0}</div>
                </div>
              </div>
            </div>
          </div>
        </button>
      {/each}
    </div>
  {:else}
    <div class="no-teams">
      <p>No teams found. Make sure the FastAPI server is running on localhost:8000</p>
    </div>
  {/if}
  
  {#if signedInTeam}
    <div class="footer">
      <button class="sign-out-btn" on:click={handleSignOut}>
        Sign Out
      </button>
    </div>
  {/if}
</div>

<!-- Sign In Modal -->
{#if showSignInModal && selectedTeam}
  <div class="modal-overlay" on:click={closeModal}>
    <div class="modal" on:click|stopPropagation on:keydown={handleKeyPress}>
      
      {#if signInStep === 'choose'}
        <div class="modal-header">
          <div class="modal-title">Sign In</div>
          <div class="modal-subtitle">{selectedTeam.team_name}</div>
        </div>

        <div class="form-group">
          <div class="form-label">Choose verification method:</div>
          <div class="auth-method-buttons">
            <button 
              class="auth-method-btn {authMethod === 'email' ? 'active' : ''}"
              on:click={() => authMethod = 'email'}
            >
              📧 Email
            </button>
            <button 
              class="auth-method-btn {authMethod === 'sms' ? 'active' : ''}"
              on:click={() => authMethod = 'sms'}
            >
              📱 SMS
            </button>
          </div>
        </div>

        {#if contacts[selectedTeam.id]}
          <div class="form-group">
            <div class="form-label">
              Code will be sent to:
            </div>
            <div style="color: #06b6d4; font-weight: 500;">
              {#if authMethod === 'email'}
                {contacts[selectedTeam.id].email}
              {:else}
                {contacts[selectedTeam.id].phone}
              {/if}
            </div>
          </div>
        {/if}

        <div class="modal-actions">
          <button 
            class="btn btn-primary" 
            on:click={sendVerificationCode}
            disabled={isLoading}
          >
            {#if isLoading}
              <div class="spinner"></div>
              Sending...
            {:else}
              Send Code
            {/if}
          </button>
          <button class="btn btn-secondary" on:click={closeModal}>Cancel</button>
        </div>

      {:else if signInStep === 'code'}
        <div class="modal-header">
          <div class="modal-title">Enter Verification Code</div>
          <div class="modal-subtitle">
            Code sent to {authMethod === 'email' ? 'email' : 'SMS'}
          </div>
        </div>

        {#if verificationCode}
          <div class="dev-code">
            Dev Code: {verificationCode}
          </div>
        {/if}

        <div class="form-group">
          <div class="form-label">Verification Code:</div>
          <input 
            class="form-input" 
            type="text" 
            bind:value={inputCode}
            placeholder="######"
            maxlength="6"
            on:keydown={handleKeyPress}
            autofocus
          />
        </div>

        <div class="modal-actions">
          <button 
            class="btn btn-primary" 
            on:click={verifyCode}
            disabled={!inputCode || inputCode.length < 4}
          >
            Verify
          </button>
          <button class="btn btn-secondary" on:click={() => signInStep = 'choose'}>
            Back
          </button>
        </div>

      {:else if signInStep === 'success'}
        <div class="success-message">
          <div class="success-icon">✅</div>
          <div class="modal-title">Welcome!</div>
          <div class="modal-subtitle">
            Signed in as {selectedTeam.team_name}
          </div>
          <p style="margin-top: 1rem; color: #94a3b8;">
            Redirecting to free agents...
          </p>
        </div>
      {/if}

      {#if errorMessage}
        <div class="error-message">{errorMessage}</div>
      {/if}
    </div>
  </div>
{/if}