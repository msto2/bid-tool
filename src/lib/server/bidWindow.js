/**
 * Server-side bid window utilities that use file-based settings
 */

import { loadBidWindowSettingsFromFile } from './bidWindowStorage.js';

/**
 * Check if bidding is currently allowed (server-side)
 * @returns {Object} { allowed: boolean, reason: string, nextWindow: Date|null }
 */
export function isBiddingAllowed() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const hour = now.getHours();
  
  const settings = loadBidWindowSettingsFromFile();
  const { closeDay, closeHour, openDay, openHour } = settings;
  
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
    reason = `Bidding closed ${closeDayName} at ${formatHour(closeHour)}`;
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
 * Check if current time is in the closed period (server-side)
 * @param {number} dayOfWeek - Current day of week
 * @param {number} hour - Current hour
 * @returns {boolean} True if in closed period
 */
function isInClosedPeriod(dayOfWeek, hour) {
  const settings = loadBidWindowSettingsFromFile();
  const { closeDay, closeHour, openDay, openHour } = settings;
  
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
 * Get the next time when bidding will be allowed (server-side)
 * @returns {Date} Next bidding window opening time
 */
function getNextBiddingWindow() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();
  const settings = loadBidWindowSettingsFromFile();
  const { openDay, openHour } = settings;
  
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
 * Get the next time when bidding will close (server-side)
 * @returns {Date} Next bidding window closing time
 */
function getNextCloseTime() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();
  const settings = loadBidWindowSettingsFromFile();
  const { closeDay, closeHour } = settings;
  
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
 * Get the current bid period identifier
 * A bid period runs from open time to close time
 * @returns {string} Period identifier (YYYY-MM-DD format of the period start)
 */
export function getCurrentBidPeriod() {
  const now = new Date();
  const settings = loadBidWindowSettingsFromFile();
  const { openDay, openHour } = settings;
  
  // Find the start of the current bid period
  const periodStart = getCurrentPeriodStart(now);
  
  // Format as YYYY-MM-DD for the period identifier
  const year = periodStart.getFullYear();
  const month = String(periodStart.getMonth() + 1).padStart(2, '0');
  const day = String(periodStart.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get the start date of the current bid period
 * @param {Date} currentDate - Current date
 * @returns {Date} Start of current bid period
 */
function getCurrentPeriodStart(currentDate = new Date()) {
  const settings = loadBidWindowSettingsFromFile();
  const { openDay, openHour } = settings;
  
  const now = new Date(currentDate);
  const dayOfWeek = now.getDay();
  const hour = now.getHours();
  
  // Calculate days back to the most recent open day/hour
  let daysBack;
  
  if (dayOfWeek === openDay) {
    // It's the open day
    if (hour >= openHour) {
      // After open hour - period started today
      daysBack = 0;
    } else {
      // Before open hour - period started last week
      daysBack = 7;
    }
  } else {
    // Calculate days back to most recent open day
    daysBack = dayOfWeek > openDay ? 
      dayOfWeek - openDay : 
      dayOfWeek + (7 - openDay);
  }
  
  const periodStart = new Date(now);
  periodStart.setDate(now.getDate() - daysBack);
  periodStart.setHours(openHour, 0, 0, 0);
  
  return periodStart;
}

/**
 * Get the current bid period range (start and end times)
 * @returns {Object} { start: Date, end: Date, periodId: string }
 */
export function getCurrentBidPeriodRange() {
  const settings = loadBidWindowSettingsFromFile();
  const { openDay, openHour, closeDay, closeHour } = settings;
  
  const periodStart = getCurrentPeriodStart();
  
  // Calculate the end of this period
  const periodEnd = new Date(periodStart);
  
  // Add days to get to close day
  const daysToAdd = closeDay > openDay ? 
    closeDay - openDay : 
    (7 - openDay) + closeDay;
    
  periodEnd.setDate(periodStart.getDate() + daysToAdd);
  periodEnd.setHours(closeHour, 0, 0, 0);
  
  return {
    start: periodStart,
    end: periodEnd,
    periodId: getCurrentBidPeriod()
  };
}

/**
 * Get time remaining until next bidding window change (server-side)
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

/**
 * Get a human-readable status of the current bidding window (server-side)
 * @returns {Object} Status information with formatted strings
 */
export function getBiddingWindowStatus() {
  const status = isBiddingAllowed();
  const periodRange = getCurrentBidPeriodRange();
  
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

  // Format full date and time for cycle display
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
    
    const formatHour = (h) => {
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? 'am' : 'pm';
      return `${hour12}${ampm}`;
    };
    
    return `${dayName} ${monthName} ${getOrdinal(dayNum)} ${formatHour(hour)}`;
  };
  
  const cycleInfo = `${formatDateTime(periodRange.start)} - ${formatDateTime(periodRange.end)}`;
  
  return {
    ...status,
    statusText: status.allowed ? 'Bidding Open' : 'Bidding Closed',
    nextWindowText: status.nextWindow ? `Opens: ${formatTime(status.nextWindow)}` : '',
    currentTimeText: formatTime(status.currentTime),
    bidCycle: cycleInfo,
    periodId: periodRange.periodId,
    periodRange
  };
}

/**
 * Get current bid window settings (server-side)
 * @returns {Object} Current settings
 */
export function getBidWindowSettings() {
  return loadBidWindowSettingsFromFile();
}