const axios = require('axios');
const logger = require('../utils/logger');

class ActivityService {
  constructor() {
    this.mockActivities = [
      {
        name: "City Walking Tour",
        duration: "3 hours",
        price: 45,
        category: "cultural",
        description: "Explore the historic downtown area with a local guide"
      },
      {
        name: "Museum Visit",
        duration: "2 hours",
        price: 25,
        category: "cultural",
        description: "Visit the famous art museum"
      },
      {
        name: "Adventure Park",
        duration: "4 hours",
        price: 65,
        category: "adventure",
        description: "Zip-lining and rock climbing experience"
      }
    ];
  }

  async searchActivities(destination, category, date, participants) {
    try {
      logger.info(`Searching activities in ${destination}`);
      
      let filteredActivities = this.mockActivities;
      
      if (category) {
        filteredActivities = filteredActivities.filter(activity => 
          activity.category === category
        );
      }
      
      return filteredActivities.map(activity => ({
        ...activity,
        location: destination,
        date,
        total_price: activity.price * participants,
        participants
      }));
    } catch (error) {
      logger.error('Activity search error:', error);
      throw new Error('Failed to search activities');
    }
  }

  async bookActivity(activityDetails, participantInfo) {
    try {
      const bookingReference = `AC${Date.now()}`;
      
      return {
        booking_reference: bookingReference,
        status: 'confirmed',
        confirmation_number: bookingReference,
        ...activityDetails
      };
    } catch (error) {
      logger.error('Activity booking error:', error);
      throw new Error('Failed to book activity');
    }
  }
}

module.exports = new ActivityService();