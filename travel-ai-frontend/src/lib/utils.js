// travel-ai-frontend/src/lib/utils.js
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatDate = (date, options = {}) => {
  // Handle invalid or null dates
  if (!date) {
    return 'Date not available';
  }

  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  
  try {
    // Handle different date formats
    let dateObj;
    
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string' || typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      throw new Error('Invalid date format');
    }

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date value');
    }

    return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
  } catch (error) {
    console.warn('Date formatting error:', error, 'Date value:', date);
    return 'Invalid date';
  }
};

export const formatDateShort = (date) => {
  if (!date) {
    return 'N/A';
  }

  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(dateObj);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return 'Invalid date';
  }
};

export const formatTime = (date) => {
  if (!date) {
    return 'N/A';
  }

  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Invalid time';
    }

    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(dateObj);
  } catch (error) {
    console.warn('Time formatting error:', error);
    return 'Invalid time';
  }
};

export const calculateDays = (startDate, endDate) => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }
    
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.warn('Date calculation error:', error);
    return 0;
  }
};

export const calculateNights = (startDate, endDate) => {
  return Math.max(0, calculateDays(startDate, endDate) - 1);
};

export const getRelativeTime = (date) => {
  if (!date) {
    return 'N/A';
  }

  try {
    const now = new Date();
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }

    const diffInHours = Math.abs(now - dateObj) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `${Math.round(diffInHours)} hours ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.round(diffInHours / 24)} days ago`;
    } else {
      return formatDate(dateObj, { month: 'short', day: 'numeric' });
    }
  } catch (error) {
    console.warn('Relative time error:', error);
    return 'N/A';
  }
};

export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

export const truncateText = (text, length = 100) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  const minLength = password.length >= 8;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return {
    isValid: minLength && hasLower && hasUpper && hasNumber && hasSpecial,
    minLength,
    hasLower,
    hasUpper,
    hasNumber,
    hasSpecial
  };
};

export const getFlightDuration = (departureTime, arrivalTime) => {
  try {
    const departure = new Date(departureTime);
    const arrival = new Date(arrivalTime);
    
    if (isNaN(departure.getTime()) || isNaN(arrival.getTime())) {
      return 'N/A';
    }

    const diffInMinutes = Math.abs(arrival - departure) / (1000 * 60);
    
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = Math.round(diffInMinutes % 60);
    
    return `${hours}h ${minutes}m`;
  } catch (error) {
    console.warn('Flight duration calculation error:', error);
    return 'N/A';
  }
};

export const getLayoverDuration = (firstArrival, secondDeparture) => {
  try {
    const arrival = new Date(firstArrival);
    const departure = new Date(secondDeparture);
    
    if (isNaN(arrival.getTime()) || isNaN(departure.getTime())) {
      return 'N/A';
    }

    const diffInMinutes = Math.abs(departure - arrival) / (1000 * 60);
    
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = Math.round(diffInMinutes % 60);
    
    return `${hours}h ${minutes}m`;
  } catch (error) {
    console.warn('Layover duration calculation error:', error);
    return 'N/A';
  }
};

export const formatFlightTime = (dateTime) => {
  try {
    const date = new Date(dateTime);
    if (isNaN(date.getTime())) {
      return 'Invalid time';
    }

    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  } catch (error) {
    console.warn('Flight time formatting error:', error);
    return 'Invalid time';
  }
};

export const getBudgetCategory = (amount) => {
  if (amount < 1000) return { category: 'budget', color: 'green', icon: '💰' };
  if (amount < 3000) return { category: 'mid-range', color: 'blue', icon: '🏨' };
  return { category: 'luxury', color: 'purple', icon: '✨' };
};

export const getTripDuration = (days) => {
  if (days <= 2) return 'Weekend Trip';
  if (days <= 7) return 'Week-long Adventure';
  if (days <= 14) return 'Extended Vacation';
  return 'Long Journey';
};

export const getSeasonFromDate = (date) => {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Unknown';
    }

    const month = dateObj.getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  } catch (error) {
    console.warn('Season calculation error:', error);
    return 'Unknown';
  }
};

export const sortByPrice = (items, ascending = true) => {
  return [...items].sort((a, b) => {
    const priceA = a.price || a.total_price || 0;
    const priceB = b.price || b.total_price || 0;
    return ascending ? priceA - priceB : priceB - priceA;
  });
};

export const sortByRating = (items, ascending = false) => {
  return [...items].sort((a, b) => {
    const ratingA = a.rating || 0;
    const ratingB = b.rating || 0;
    return ascending ? ratingA - ratingB : ratingB - ratingA;
  });
};

export const filterByPriceRange = (items, minPrice, maxPrice) => {
  return items.filter(item => {
    const price = item.price || item.total_price || 0;
    return price >= minPrice && price <= maxPrice;
  });
};

export const groupByDay = (activities) => {
  return activities.reduce((groups, activity) => {
    const day = activity.day || 1;
    if (!groups[day]) groups[day] = [];
    groups[day].push(activity);
    return groups;
  }, {});
};

export const calculateTotalBudget = (budgetBreakdown) => {
  return Object.values(budgetBreakdown).reduce((total, amount) => {
    return total + (typeof amount === 'number' ? amount : 0);
  }, 0);
};

export const getProgressColor = (percentage) => {
  if (percentage < 25) return 'bg-red-500';
  if (percentage < 50) return 'bg-yellow-500';
  if (percentage < 75) return 'bg-blue-500';
  return 'bg-green-500';
};

export const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};

export const getCountryFromCity = (cityName) => {
  const cityCountryMap = {
    'new york': 'United States',
    'london': 'United Kingdom',
    'paris': 'France',
    'tokyo': 'Japan',
    'dubai': 'United Arab Emirates',
    'singapore': 'Singapore',
    'sydney': 'Australia',
    'los angeles': 'United States',
    'rome': 'Italy',
    'madrid': 'Spain'
  };
  
  return cityCountryMap[cityName.toLowerCase()] || 'Unknown';
};

export const getCurrencySymbol = (currency) => {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'AUD': 'A$',
    'CAD': 'C$'
  };
  return symbols[currency] || currency;
};

// Safe date formatter for components
export const safeFormatDate = (date, fallback = 'Date not available') => {
  try {
    if (!date) return fallback;
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return fallback;
    
    return formatDate(dateObj);
  } catch (error) {
    console.warn('Safe date formatting error:', error);
    return fallback;
  }
};