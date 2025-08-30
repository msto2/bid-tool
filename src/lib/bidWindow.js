/**
 * Client-side bid window utilities for managing when bids can be submitted
 * Bids are not allowed between Wednesday 9 PM and Sunday 9 PM (default)
 * Can be customized via manager settings
 */

// Default settings (can be overridden by manager)
const DEFAULT_SETTINGS = {
  closeDay: 3, // Wednesday (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  closeHour: 21, // 9 PM
  openDay: 0, // Sunday
  openHour: 21 // 9 PM
};

// In-memory settings cache
let bidWindowSettings = { ...DEFAULT_SETTINGS };

/**
 * Load settings from localStorage (client-side only)
 */
function loadSettings() {
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem('bidWindowSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        bidWindowSettings = { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.error('Error loading bid window settings from localStorage:', error);
    }
  }
}

/**
 * Save settings to localStorage (client-side only)
 */
function saveSettings(settings) {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('bidWindowSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving bid window settings to localStorage:', error);
    }
  }
}

// Initialize settings on module load
loadSettings();

/**
 * Get current bid window settings
 * @returns {Object} Current settings
 */
export function getBidWindowSettings() {
  return { ...bidWindowSettings };
}

/**
 * Update bid window settings
 * @param {Object} newSettings - New settings object
 */
export function updateBidWindowSettings(newSettings) {
  bidWindowSettings = { ...bidWindowSettings, ...newSettings };
  saveSettings(bidWindowSettings);
}

/**
 * Load bid window settings (refresh from storage)
 */
export function loadBidWindowSettings() {
  loadSettings();
}

/**
 * Check if bidding is currently allowed
 * @returns {Object} { allowed: boolean, reason: string, nextWindow: Date|null, currentTime: Date }
 */
export function isBiddingAllowed() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const hour = now.getHours();
  
  const { closeDay, closeHour, openDay, openHour } = bidWindowSettings;
  
  // Check if we're in the blackout period
  let biddingClosed = false;
  let reason = '';
  let nextWindow = null;
  
  // Convert day numbers to day names for display
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const closeDayName = dayNames[closeDay];
  const openDayName = dayNames[openDay];
  
  // Format hour for display (24h to 12h)
  const formatHour = (h) => {
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const ampm = h < 12 ? 'am' : 'pm';
    return `${hour12}${ampm}`;
  };

  // Format full date and time
  const formatDateTime = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNum = date.getDate();
    const hour = date.getHours();
    
    // Add ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
    const getOrdinal = (n) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    
    return `${dayName} ${monthName} ${getOrdinal(dayNum)} ${formatHour(hour)}`;
  };
  
  if (dayOfWeek === closeDay && hour >= closeHour) {
    // Close day at close hour or later
    biddingClosed = true;
    reason = `Bidding closes ${closeDayName} at ${formatHour(closeHour)}`;
    nextWindow = getNextBiddingWindow();
  } else if (isInClosedPeriod(dayOfWeek, hour)) {
    biddingClosed = true;
    const nextOpenTime = getNextBiddingWindow();
    reason = `Bidding is closed until ${formatDateTime(nextOpenTime)}`;
    nextWindow = nextOpenTime;
  }
  
  // Calculate the open period information
  let openPeriodInfo = '';
  if (!biddingClosed) {
    const nextCloseTime = getNextCloseTime();
    
    if (nextCloseTime) {
      openPeriodInfo = `Bidding is open until ${formatDateTime(nextCloseTime)}`;
    } else {
      // Fallback: show general schedule
      openPeriodInfo = `Bidding window: ${openDayName} ${formatHour(openHour)} - ${closeDayName} ${formatHour(closeHour)}`;
    }
  }
  
  return {
    allowed: !biddingClosed,
    reason: biddingClosed ? reason : openPeriodInfo,
    nextWindow,
    currentTime: now
  };
}

/**
 * Check if current time is in the closed period
 * @param {number} dayOfWeek - Current day of week
 * @param {number} hour - Current hour
 * @returns {boolean} True if in closed period
 */
function isInClosedPeriod(dayOfWeek, hour) {
  const { closeDay, closeHour, openDay, openHour } = bidWindowSettings;
  
  // Handle case where close day is before open day (normal case)
  if (closeDay < openDay) {
    // Closed period spans from closeDay to openDay
    if (dayOfWeek > closeDay && dayOfWeek < openDay) {
      return true;
    }
    if (dayOfWeek === openDay && hour < openHour) {
      return true;
    }
  } else if (closeDay > openDay) {
    // Closed period spans across week boundary (e.g., Friday to Tuesday)
    if (dayOfWeek > closeDay || dayOfWeek < openDay) {
      return true;
    }
    if (dayOfWeek === openDay && hour < openHour) {
      return true;
    }
  } else {
    // closeDay === openDay - bidding closed for part of the same day
    if (dayOfWeek === closeDay && hour >= closeHour && hour < openHour) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get the next time when bidding will be allowed
 * @returns {Date} Next bidding window opening time
 */
function getNextBiddingWindow() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();
  const { openDay, openHour } = bidWindowSettings;
  
  let daysUntilOpen;
  
  if (dayOfWeek === openDay) {
    // It's the open day
    if (hour < openHour) {
      // Before open hour - next window is today at open hour
      const nextWindow = new Date(now);
      nextWindow.setHours(openHour, 0, 0, 0);
      return nextWindow;
    } else {
      // After open hour - next window is next week at open day/hour
      daysUntilOpen = 7;
    }
  } else {
    // Calculate days until next open day
    daysUntilOpen = openDay > dayOfWeek ? 
      openDay - dayOfWeek : 
      7 - dayOfWeek + openDay;
  }
  
  // Next window is at open day/hour
  const nextWindow = new Date(now);
  nextWindow.setDate(now.getDate() + daysUntilOpen);
  nextWindow.setHours(openHour, 0, 0, 0);
  
  return nextWindow;
}

/**
 * Get the next time when bidding will close
 * @returns {Date} Next bidding window closing time
 */
function getNextCloseTime() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();
  const { closeDay, closeHour } = bidWindowSettings;
  
  let daysUntilClose;
  
  if (dayOfWeek === closeDay) {
    // It's the close day
    if (hour < closeHour) {
      // Before close hour - closes today at close hour
      const nextClose = new Date(now);
      nextClose.setHours(closeHour, 0, 0, 0);
      return nextClose;
    } else {
      // After close hour - next close is next week at close day/hour
      daysUntilClose = 7;
    }
  } else {
    // Calculate days until next close day
    daysUntilClose = closeDay > dayOfWeek ? 
      closeDay - dayOfWeek : 
      7 - dayOfWeek + closeDay;
  }
  
  // Next close is at close day/hour
  const nextClose = new Date(now);
  nextClose.setDate(now.getDate() + daysUntilClose);
  nextClose.setHours(closeHour, 0, 0, 0);
  
  return nextClose;
}

/**
 * Get a human-readable status of the current bidding window
 * @returns {Object} Status information with formatted strings
 */
export function getBiddingWindowStatus() {
  const status = isBiddingAllowed();
  
  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  return {
    ...status,
    statusText: status.allowed ? '🟢 Bidding Open' : '🔴 Bidding Closed',
    nextWindowText: status.nextWindow ? `Opens: ${formatTime(status.nextWindow)}` : '',
    currentTimeText: formatTime(status.currentTime)
  };
}

/**
 * Get time remaining until next bidding window change
 * @returns {Object} Time remaining information
 */
export function getTimeUntilWindowChange() {
  const status = isBiddingAllowed();
  const now = new Date();
  
  let targetTime;
  let changeType;
  
  if (status.allowed) {
    // Bidding is open - find when it closes
    targetTime = getNextCloseTime();
    changeType = 'closes';
  } else {
    // Bidding is closed - use the next window opening time
    targetTime = status.nextWindow;
    changeType = 'opens';
  }
  
  if (!targetTime) return null;
  
  const timeDiff = targetTime.getTime() - now.getTime();
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
  
  // Show seconds when under 2 minutes (120 seconds)
  const totalSeconds = Math.floor(timeDiff / 1000);
  const showSeconds = totalSeconds <= 120 && totalSeconds > 0;
  
  let formattedTime;
  if (showSeconds) {
    // Under 2 minutes - show minutes and seconds
    if (minutes > 0) {
      formattedTime = `${minutes}m ${seconds}s`;
    } else {
      formattedTime = `${seconds}s`;
    }
  } else {
    // Over 2 minutes - show regular format
    formattedTime = `${days > 0 ? `${days}d ` : ''}${hours}h ${minutes}m`;
  }
  
  return {
    changeType,
    targetTime,
    days,
    hours,
    minutes,
    seconds,
    totalMinutes: Math.floor(timeDiff / (1000 * 60)),
    totalSeconds,
    showSeconds,
    formattedTime
  };
}