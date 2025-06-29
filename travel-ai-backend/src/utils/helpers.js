class Helpers {
  static calculateDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  }

  static formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  static generateBookingReference(type) {
    const prefix = {
      flight: 'FL',
      hotel: 'HT',
      activity: 'AC',
      package: 'PK'
    };
    
    return `${prefix[type] || 'BK'}${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }

  static validateDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    if (start < now) {
      throw new Error('Start date cannot be in the past');
    }
    
    if (end <= start) {
      throw new Error('End date must be after start date');
    }
    
    const maxDays = 365; // Maximum trip length
    if (this.calculateDays(startDate, endDate) > maxDays) {
      throw new Error(`Trip cannot exceed ${maxDays} days`);
    }
    
    return true;
  }

  static sanitizeUserInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .slice(0, 1000); // Limit length
  }
}

module.exports = Helpers;