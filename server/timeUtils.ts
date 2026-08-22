/**
 * Utility functions for India Standard Time (Asia/Kolkata / UTC+5:30)
 */

export function getIndianDateFormatted(dateObj = new Date()): string {
  // Format: "22 August 2026"
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return formatter.format(dateObj);
}

export function getIndianISODate(dateObj = new Date()): string {
  // Format: "YYYY-MM-DD"
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(dateObj);
}

export function getIndianTimestampFormatted(dateObj = new Date()): string {
  // Format: "22 Aug 2026, 11:45 AM IST"
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  return `${formatter.format(dateObj)} IST`;
}

export function getIndianISOString(dateObj = new Date()): string {
  // Return standard ISO format representing current point in time
  return dateObj.toISOString();
}
