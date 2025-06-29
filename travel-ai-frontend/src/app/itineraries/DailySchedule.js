'use client';

import { useState } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon,
  CurrencyDollarIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '../../lib/utils';

const DailySchedule = ({ dailyItinerary }) => {
  const [expandedDays, setExpandedDays] = useState(new Set([1])); // First day expanded by default

  const toggleDay = (dayNumber) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayNumber)) {
      newExpanded.delete(dayNumber);
    } else {
      newExpanded.add(dayNumber);
    }
    setExpandedDays(newExpanded);
  };

  const getTimeIcon = (period) => {
    switch (period) {
      case 'morning': return '🌅';
      case 'afternoon': return '☀️';
      case 'evening': return '🌆';
      default: return '🕐';
    }
  };

  if (!dailyItinerary || dailyItinerary.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No daily itinerary available</h3>
        <p className="text-gray-600">The itinerary details will appear here once generated.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Daily Itinerary</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setExpandedDays(new Set(dailyItinerary.map(day => day.day)))}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Expand All
          </button>
          <button
            onClick={() => setExpandedDays(new Set())}
            className="text-sm text-gray-600 hover:text-gray-700"
          >
            Collapse All
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {dailyItinerary.map((day, index) => {
          const isExpanded = expandedDays.has(day.day);
          
          return (
            <div key={day.day} className="card overflow-hidden">
              {/* Day Header */}
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleDay(day.day)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-bold">{day.day}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Day {day.day}
                      </h3>
                      <p className="text-gray-600">
                        {formatDate(day.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Daily Budget</p>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(day.budget_allocated)}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Day Content */}
              {isExpanded && (
                <div className="border-t border-gray-200">
                  <div className="p-6 space-y-6">
                    {/* Time Periods */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { period: 'morning', activity: day.morning, icon: '🌅' },
                       { period: 'afternoon', activity: day.afternoon, icon: '☀️' },
                       { period: 'evening', activity: day.evening, icon: '🌆' }
                     ].map(({ period, activity, icon }) => (
                       <div key={period} className="bg-gray-50 rounded-lg p-4">
                         <div className="flex items-center space-x-2 mb-3">
                           <span className="text-xl">{icon}</span>
                           <h4 className="font-medium text-gray-900 capitalize">{period}</h4>
                         </div>
                         <p className="text-gray-700 text-sm leading-relaxed">{activity}</p>
                       </div>
                     ))}
                   </div>

                   {/* Meals */}
                   {day.meals && (
                     <div>
                       <h4 className="font-medium text-gray-900 mb-4 flex items-center space-x-2">
                         <span>🍽️</span>
                         <span>Meal Recommendations</span>
                       </h4>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         {[
                           { meal: 'breakfast', recommendation: day.meals.breakfast, icon: '🥐' },
                           { meal: 'lunch', recommendation: day.meals.lunch, icon: '🍽️' },
                           { meal: 'dinner', recommendation: day.meals.dinner, icon: '🍷' }
                         ].map(({ meal, recommendation, icon }) => (
                           <div key={meal} className="border border-gray-200 rounded-lg p-3">
                             <div className="flex items-center space-x-2 mb-2">
                               <span>{icon}</span>
                               <span className="font-medium text-gray-900 capitalize text-sm">{meal}</span>
                             </div>
                             <p className="text-gray-600 text-sm">{recommendation}</p>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               </div>
             )}
           </div>
         );
       })}
     </div>
   </div>
 );
};

export default DailySchedule;