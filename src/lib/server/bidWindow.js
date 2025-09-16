/**
 * Server-side bid window utilities that use file-based settings
 */

import { DateTime } from 'luxon';
import { loadBidWindowSettingsFromFile } from './bidWindowStorage.js';

/**
 * Get current Eastern Time
 * @returns {DateTime} Current time in Eastern timezone
 */
function getEasternTime() {
  return DateTime.now().setZone('America/New_York');
}

/**
 * Convert a Date object to Eastern Time DateTime
 * @param {Date} date - Date object to convert
 * @returns {DateTime} DateTime in Eastern timezone
 */
function toEasternTime(date) {
  return DateTime.fromJSDate(date).setZone('America/New_York');
}

/**
 * Check if bidding is currently allowed (server-side)
 * @returns {Object} { allowed: boolean, reason: string, nextWindow: Date|null }
 */
export function isBiddingAllowed() {
  const now = getEasternTime();
  const dayOfWeek = now.weekday === 7 ? 0 : now.weekday; // Convert Luxon weekday (1=Monday, 7=Sunday) to JavaScript (0=Sunday, 1=Monday)
  const hour = now.hour;
  
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

  // Format full date and time (accepts Date or DateTime object)
  const formatDateTime = (dateInput) => {
    if (!dateInput) return '';
    
    // Convert to DateTime if it's a Date object
    const dateTime = dateInput instanceof Date ? 
      DateTime.fromJSDate(dateInput).setZone('America/New_York') : 
      dateInput;
    
    // Add ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
    const getOrdinal = (n) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    
    const dayName = dateTime.toFormat('cccc'); // Full weekday name
    const monthName = dateTime.toFormat('MMMM'); // Full month name
    const dayNum = dateTime.day;
    const hour = dateTime.hour;
    
    return `${dayName} ${monthName} ${getOrdinal(dayNum)} ${formatHour(hour)} EST`;
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
    currentTime: now.toJSDate() // Convert DateTime back to Date for compatibility
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
  const now = getEasternTime();
  const dayOfWeek = now.weekday === 7 ? 0 : now.weekday; // Convert Luxon weekday to JavaScript weekday
  const hour = now.hour;
  const settings = loadBidWindowSettingsFromFile();
  const { openDay, openHour } = settings;
  
  let daysUntilOpen;
  
  if (dayOfWeek === openDay) {
    // It's the open day
    if (hour < openHour) {
      // Before open hour - next window is today at open hour
      const nextWindow = now.set({ hour: openHour, minute: 0, second: 0, millisecond: 0 });
      return nextWindow.toJSDate();
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
  const nextWindow = now.plus({ days: daysUntilOpen }).set({ hour: openHour, minute: 0, second: 0, millisecond: 0 });
  
  return nextWindow.toJSDate();
}

/**
 * Get the next time when bidding will close (server-side)
 * @returns {Date} Next bidding window closing time
 */
function getNextCloseTime() {
  const now = getEasternTime();
  const dayOfWeek = now.weekday === 7 ? 0 : now.weekday; // Convert Luxon weekday to JavaScript weekday
  const hour = now.hour;
  const settings = loadBidWindowSettingsFromFile();
  const { closeDay, closeHour } = settings;
  
  let daysUntilClose;
  
  if (dayOfWeek === closeDay) {
    // It's the close day
    if (hour < closeHour) {
      // Before close hour - closes today at close hour
      const nextClose = now.set({ hour: closeHour, minute: 0, second: 0, millisecond: 0 });
      return nextClose.toJSDate();
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
  const nextClose = now.plus({ days: daysUntilClose }).set({ hour: closeHour, minute: 0, second: 0, millisecond: 0 });
  
  return nextClose.toJSDate();
}

/**
 * Get the current bid period identifier
 * A bid period runs from open time to close time
 * @returns {string} Period identifier (YYYY-MM-DD format of the period start)
 */
export function getCurrentBidPeriod() {
  const now = getEasternTime();
  const settings = loadBidWindowSettingsFromFile();
  const { openDay, openHour } = settings;
  
  // Find the start of the current bid period
  const periodStart = getCurrentPeriodStart(now);
  
  // Format as YYYY-MM-DD for the period identifier
  return periodStart.toFormat('yyyy-MM-dd');
}

/**
 * Get the start date of the current bid period
 * @param {DateTime} currentDate - Current date (optional)
 * @returns {DateTime} Start of current bid period
 */
function getCurrentPeriodStart(currentDate = null) {
  const settings = loadBidWindowSettingsFromFile();
  const { openDay, openHour } = settings;

  const now = currentDate || getEasternTime();

  // The issue is Luxon's weekday is off when it's late Sunday evening in EST but Monday in UTC
  // We need to check what day it actually is in Eastern timezone
  // Use the date's local representation to determine the actual day

  // Get the year, month, and day in Eastern timezone
  const year = now.year;
  const month = now.month;
  const day = now.day;

  // Create a new date at noon Eastern (to avoid edge cases) and get its weekday
  const noonEastern = DateTime.fromObject({ year, month, day, hour: 12 }, { zone: 'America/New_York' });
  const actualWeekday = noonEastern.weekday; // 1=Monday, 7=Sunday in Luxon

  // Convert Luxon weekday to JavaScript weekday (0=Sunday)
  const dayOfWeek = actualWeekday === 7 ? 0 : actualWeekday;
  const hour = now.hour;

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

  const periodStart = now.minus({ days: daysBack }).set({ hour: openHour, minute: 0, second: 0, millisecond: 0 });

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
  
  // Add days to get to close day
  const daysToAdd = closeDay > openDay ? 
    closeDay - openDay : 
    (7 - openDay) + closeDay;
    
  const periodEnd = periodStart.plus({ days: daysToAdd }).set({ hour: closeHour, minute: 0, second: 0, millisecond: 0 });
  
  return {
    start: periodStart.toJSDate(),
    end: periodEnd.toJSDate(),
    periodId: getCurrentBidPeriod()
  };
}

/**
 * Get time remaining until next bidding window change (server-side)
 * @returns {Object} Time remaining information
 */
export function getTimeUntilWindowChange() {
  const status = isBiddingAllowed();
  const now = getEasternTime();
  
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
  
  const targetDateTime = DateTime.fromJSDate(targetTime).setZone('America/New_York');
  const timeDiff = targetDateTime.diff(now, ['days', 'hours', 'minutes', 'seconds']);
  
  const days = Math.floor(timeDiff.days);
  const hours = Math.floor(timeDiff.hours);
  const minutes = Math.floor(timeDiff.minutes);  
  const seconds = Math.floor(timeDiff.seconds);
  
  // Show seconds when under 2 minutes (120 seconds)
  const totalSeconds = Math.floor(targetDateTime.diff(now, 'seconds').seconds);
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
    totalMinutes: Math.floor(targetDateTime.diff(now, 'minutes').minutes),
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
    const easternTime = DateTime.fromJSDate(date).setZone('America/New_York');
    return easternTime.toLocaleString(DateTime.DATETIME_MED) + ' EST';
  };

  // Format full date and time for cycle display
  const formatDateTime = (date) => {
    const easternTime = DateTime.fromJSDate(date).setZone('America/New_York');
    
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
    
    const dayName = easternTime.toFormat('cccc'); // Full weekday name
    const monthName = easternTime.toFormat('MMMM'); // Full month name
    const dayNum = easternTime.day;
    const hour = easternTime.hour;
    
    return `${dayName} ${monthName} ${getOrdinal(dayNum)} ${formatHour(hour)} EST`;
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