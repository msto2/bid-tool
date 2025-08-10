# CLAUDE.md - Root Routes

This file provides guidance to Claude Code (claude.ai/code) when working with the root-level route components.

## Overview

The root routes directory contains the main application entry points, authentication system, and core navigation structure for the fantasy football bid tool.

## File Structure

- `+page.server.js` - Home page server-side data loading
- `+page.svelte` - Team selection and authentication interface
- `api/send-code/+server.js` - Verification code API endpoint

## Core Components

### Home Page (`+page.svelte`)

#### Authentication System
- **Multi-step Modal**: Team selection → Method choice → Code verification → Success
- **Dual Verification**: Email and SMS options for user verification
- **Contact Integration**: Links team IDs with `contacts.js` for delivery addresses
- **Persistent Sessions**: localStorage-based authentication with 24-hour expiration

#### Team Selection Interface
- **Grid Layout**: Responsive team cards showing wins, losses, and points
- **Real-time Data**: Fetches current season standings from FastAPI
- **Visual Design**: Glassmorphism cards with hover effects and gradients

### Authentication Flow

#### Step 1: Team Selection
- User clicks team card to initiate sign-in
- Maps team ID to contact information from `contacts.js`
- Displays team name and available verification methods

#### Step 2: Verification Method
- **Email Option**: Shows masked email address
- **SMS Option**: Shows masked phone number  
- **Visual Feedback**: Active method highlighting and delivery address display

#### Step 3: Code Verification
- **Development Mode**: Shows verification code in UI for testing
- **Input Validation**: 4-6 character code requirement
- **Error Handling**: Clear feedback for invalid codes
- **Keyboard Support**: Enter key submission

#### Step 4: Success & Redirect
- **Success Animation**: Checkmark icon with welcome message
- **localStorage Storage**: Persistent authentication token
- **Auto-redirect**: 1.5-second delay before navigation to free-agents

### API Integration (`api/send-code/+server.js`)

#### Verification Code System
- **Code Generation**: 6-digit random codes
- **Development Logging**: Console output for email/SMS codes
- **Production Ready**: Commented examples for Twilio (SMS) and SendGrid (email)
- **Error Handling**: Comprehensive validation and error responses

#### Security Features
- **Contact Masking**: Hides partial email/phone for privacy
- **Rate Limiting Ready**: Structure supports future rate limiting
- **Timeout Protection**: Request timeout handling
- **Input Validation**: Required field checking and sanitization

## Data Architecture

### Team Data Structure
```javascript
{
  id: string,           // Team ID from FastAPI
  team_name: string,    // Display name
  wins: number,         // Season wins
  losses: number,       // Season losses
  points_for: number    // Total points scored
}
```

### Authentication Token
```javascript
{
  id: string,          // Team ID
  name: string,        // Team name
  signedInAt: number   // Unix timestamp
}
```

### Contact Information
```javascript
{
  "teamId": {
    email: string,     // Email address
    phone: string      // Phone number
  }
}
```

## Authentication Architecture

### Session Management
- **Storage Key**: `'signedInTeam'` in localStorage
- **Expiration**: 24-hour automatic logout
- **Validation**: Token structure and timestamp verification
- **Cross-page**: Consistent authentication state across routes

### Security Considerations
- **Client-side Only**: No backend authentication database
- **Contact Privacy**: Masked display of verification destinations
- **Session Expiry**: Automatic cleanup of expired sessions
- **Input Sanitization**: Validation of user inputs

## Styling Architecture

### Design System
- **Dark Theme**: Gradient backgrounds with glassmorphism effects
- **Color Palette**: Blue/cyan/green gradient scheme
- **Typography**: Inter font family with weight variations
- **Component Library**: Consistent button, modal, and card styles

### Responsive Design
- **Mobile-First**: Optimized for touch interactions
- **Breakpoints**: 640px mobile, 768px tablet, 1024px desktop
- **Flexible Layouts**: CSS Grid for team cards, Flexbox for components
- **Animation System**: Consistent fade/slide transitions

### Modal System
- **Backdrop**: Blur effect with dark overlay
- **Animations**: Slide-up entrance, fade-out exit
- **Keyboard Support**: ESC key closing, Enter key progression
- **Mobile Optimization**: Full-screen on small devices

## Integration Points

### FastAPI Backend
- **Team Endpoint**: `/teams` for current standings
- **Error Handling**: Graceful fallbacks for API failures
- **Data Mapping**: Team ID consistency across systems

### Contact System
- **File Location**: `src/lib/data/contacts.js`
- **ID Mapping**: Links team IDs to contact information
- **Verification Integration**: Email/SMS delivery addresses

### Route Protection
- **No Auto-redirect**: Authenticated users can stay on home page (changed from automatic redirect)
- **Session Validation**: Checks token validity and expiration
- **Navigation Flow**: Manual navigation between pages with clean header design

## Header Layout Design

### Clean Architecture Implementation
- **Compact Navigation**: User navigation positioned to right of page title (desktop)
- **No Team Display**: Removed team name from navigation for cleaner appearance
- **Desktop Layout**: Absolutely positioned navigation (top: 50%, right: 0, transform: translateY(-50%))
- **Mobile Layout**: Stacked navigation above page content with center alignment
- **Small Buttons**: Reduced navigation button size (0.75rem font, 0.4rem x 0.6rem padding)

### Footer Sign-out
- **Bottom Placement**: Sign-out button moved to footer section
- **Right Alignment**: Mirrors navigation positioning on desktop
- **Mobile Center**: Centers sign-out button on mobile devices
- **Consistent Styling**: Maintains button design but in footer context
- **Proper Spacing**: Top margin and border separator for visual hierarchy

## Development Considerations

### Code Generation (Production)
- **Email Service**: Integrate SendGrid or similar
- **SMS Service**: Integrate Twilio or similar
- **Environment Variables**: Store API keys securely
- **Rate Limiting**: Implement request throttling

### Testing Strategies
- **Development Mode**: Visible codes for testing
- **Mock Services**: Simulate email/SMS in development
- **Authentication Flow**: Test all modal steps and edge cases
- **Mobile Testing**: Ensure touch interactions work properly

### Error Recovery
- **Network Failures**: Clear error messages and retry options
- **Invalid Codes**: Helpful feedback and reset capabilities
- **Session Expiry**: Automatic logout with redirect to home
- **Contact Issues**: Fallback for missing contact information

## Future Enhancements

### Authentication
- **Two-Factor**: Enhanced security with TOTP support
- **Social Login**: Integration with Google/Facebook OAuth
- **Password Reset**: Email-based password recovery
- **Admin Panel**: User management for league commissioners

### User Experience  
- **Remember Me**: Extended session options
- **Quick Login**: Recently used teams shortcuts
- **Profile Management**: User preference settings
- **Notification Settings**: Email/SMS preference management

### Security
- **Backend Integration**: Server-side session management
- **Role-Based Access**: Commissioner vs team owner permissions
- **Audit Logging**: Track authentication and bid activities
- **Data Encryption**: Enhanced security for sensitive data