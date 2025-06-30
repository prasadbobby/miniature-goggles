'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ClockIcon,
  StarIcon,
  ShareIcon,
  PencilIcon,
  BookmarkIcon,
  GlobeAltIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { itineraryAPI } from '../../../lib/api';
import { formatCurrency, formatDate, calculateDays, safeFormatNumber, safeFormatString, formatTime } from '../../../lib/utils';
import toast from 'react-hot-toast';

const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };
  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 ${sizeClasses[size]}`}></div>
    </div>
  );
};

const DailySchedule = ({ dailyItinerary }) => {
  if (!dailyItinerary || dailyItinerary.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No daily itinerary available</h3>
        <p className="text-gray-600">The AI-generated itinerary will appear here once created.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Daily Itinerary</h2>
      <div className="space-y-4">
        {dailyItinerary.map((day, index) => (
          <div key={day.day || index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">{day.day || index + 1}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Day {day.day || index + 1}</h3>
                  <p className="text-gray-600">{formatDate(day.date)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Daily Budget</p>
                <p className="font-semibold text-gray-900">{formatCurrency(safeFormatNumber(day.budget_allocated))}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <h4 className="font-medium text-orange-900 mb-2 flex items-center">
                  <span className="mr-2">🌅</span>
                  Morning
                </h4>
                <p className="text-orange-700 text-sm">{safeFormatString(day.morning, 'Morning activities')}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                  <span className="mr-2">☀️</span>
                  Afternoon
                </h4>
                <p className="text-blue-700 text-sm">{safeFormatString(day.afternoon, 'Afternoon activities')}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-2 flex items-center">
                  <span className="mr-2">🌆</span>
                  Evening
                </h4>
                <p className="text-purple-700 text-sm">{safeFormatString(day.evening, 'Evening activities')}</p>
              </div>
            </div>

            {day.meals && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">🍽️</span>
                  Meal Recommendations
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="border border-gray-200 rounded-lg p-3">
                    <span className="font-medium text-gray-900 text-sm flex items-center">
                      <span className="mr-2">🥐</span>
                      Breakfast
                    </span>
                    <p className="text-gray-600 text-sm mt-1">{safeFormatString(day.meals.breakfast, 'Local breakfast')}</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3">
                    <span className="font-medium text-gray-900 text-sm flex items-center">
                      <span className="mr-2">🍽️</span>
                      Lunch
                    </span>
                    <p className="text-gray-600 text-sm mt-1">{safeFormatString(day.meals.lunch, 'Local cuisine')}</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3">
                    <span className="font-medium text-gray-900 text-sm flex items-center">
                      <span className="mr-2">🍷</span>
                      Dinner
                    </span>
                    <p className="text-gray-600 text-sm mt-1">{safeFormatString(day.meals.dinner, 'Fine dining')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const BudgetBreakdown = ({ budgetBreakdown, totalBudget }) => {
  const budgetItems = [
    { key: 'flights', label: 'Flights', color: 'bg-blue-500', icon: '✈️' },
    { key: 'accommodation', label: 'Accommodation', color: 'bg-green-500', icon: '🏨' },
    { key: 'activities', label: 'Activities', color: 'bg-purple-500', icon: '🎯' },
    { key: 'food', label: 'Food & Dining', color: 'bg-orange-500', icon: '🍽️' },
    { key: 'transportation', label: 'Transportation', color: 'bg-yellow-500', icon: '🚗' },
    { key: 'miscellaneous', label: 'Miscellaneous', color: 'bg-gray-500', icon: '💼' }
  ];

  const calculatePercentage = (amount, total) => {
    return total > 0 ? Math.round((amount / total) * 100) : 0;
  };

  const totalSpent = safeFormatNumber(budgetBreakdown?.total_spent);
  const remainingBudget = totalBudget - totalSpent;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Budget Breakdown</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Budget</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBudget)}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💸</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Spent</h3>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalSpent)}</p>
          <p className="text-sm text-gray-600 mt-1">
            {calculatePercentage(totalSpent, totalBudget)}% of budget
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            remainingBudget >= 0 ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <span className="text-2xl">{remainingBudget >= 0 ? '💰' : '⚠️'}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Remaining</h3>
          <p className={`text-2xl font-bold ${
            remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(Math.abs(remainingBudget))}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {remainingBudget >= 0 ? 'Under budget' : 'Over budget'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Category Breakdown</h3>
        <div className="space-y-4">
          {budgetItems.map((item) => {
            const amount = safeFormatNumber(budgetBreakdown?.[item.key]);
            const percentage = calculatePercentage(amount, totalBudget);
            
            return (
              <div key={item.key}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium text-gray-900">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900">{formatCurrency(amount)}</span>
                    <span className="text-sm text-gray-600 ml-2">({percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${item.color}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default function ItineraryDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchItinerary();
  }, [params.id]);

  const fetchItinerary = async () => {
    try {
      const response = await itineraryAPI.getById(params.id);
      setItinerary(response.data.itinerary);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load itinerary');
      router.push('/itineraries');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Itinerary not found</h2>
          <Link href="/itineraries" className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-200">
            Back to Itineraries
          </Link>
        </div>
      </div>
    );
  }

  const { trip_details, ai_generated_plan, budget_breakdown, status } = itinerary;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="w-full">
            {/* Navigation */}
            <div className="flex items-center space-x-4 mb-6">
              <Link
                href="/itineraries"
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <span className="text-white/60">Back to Itineraries</span>
            </div>

            {/* Header Content */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  {safeFormatString(trip_details?.destination, 'Unknown Destination')}
                </h1>
                <div className="flex flex-wrap items-center gap-6 text-white/90">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5" />
                    <span>{formatDate(trip_details?.start_date)} - {formatDate(trip_details?.end_date)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-5 w-5" />
                    <span>{calculateDays(trip_details?.start_date, trip_details?.end_date)} days</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <UsersIcon className="h-5 w-5" />
                    <span>{safeFormatNumber(trip_details?.travelers, 1)} {trip_details?.travelers === 1 ? 'traveler' : 'travelers'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CurrencyDollarIcon className="h-5 w-5" />
                    <span>{formatCurrency(safeFormatNumber(trip_details?.total_budget))}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 mt-6 lg:mt-0">
                <button
                  onClick={handleShare}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  <ShareIcon className="h-5 w-5" />
                  <span>Share</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-colors">
                  <BookmarkIcon className="h-5 w-5" />
                  <span>Save</span>
                </button>
                <Link
                  href={`/itineraries/${params.id}/edit`}
                  className="flex items-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <PencilIcon className="h-5 w-5" />
                  <span>Edit</span>
                </Link>
              </div>
            </div>

            {/* Status Badge & Source Info */}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                status === 'confirmed' ? 'bg-green-100 text-green-800' :
                status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                status === 'completed' ? 'bg-purple-100 text-purple-800' :
                status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {status?.replace('_', ' ').toUpperCase() || 'DRAFT'}
              </span>
              
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1">
                <BuildingOfficeIcon className="h-4 w-4 text-white/80" />
                <span className="text-white/80 text-sm">Generated by TravelAI</span>
              </div>
              
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1">
                <GlobeAltIcon className="h-4 w-4 text-white/80" />
                <span className="text-white/80 text-sm">Source: AI-Powered Planning</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: MapPinIcon },
              { id: 'itinerary', label: 'Daily Itinerary', icon: CalendarIcon },
              { id: 'budget', label: 'Budget', icon: CurrencyDollarIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Flight Information */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="mr-3">✈️</span>
                Flight Information
              </h2>
              
              {ai_generated_plan?.flights && ai_generated_plan.flights.length > 0 ? (
                <div className="grid gap-6">
                  {ai_generated_plan.flights.map((flight, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">✈️</span>
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">{safeFormatString(flight.airline, 'Unknown Airline')}</h3>
                            <p className="text-gray-600">{safeFormatString(flight.flight_number, 'Unknown Flight')}</p>
                            <p className="text-sm text-gray-500">Duration: {safeFormatString(flight.duration, 'Unknown Duration')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">{formatCurrency(safeFormatNumber(flight.price))}</p>
                          <p className="text-sm text-gray-600">per person</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                       <div className="flex items-center justify-between">
                         <div className="text-center flex-1">
                           <p className="text-lg font-semibold text-gray-900">{safeFormatString(flight.departure_city, 'Unknown')}</p>
                           <p className="text-sm text-gray-600">{formatTime(flight.departure_time)}</p>
                           <p className="text-sm text-gray-600">Departure</p>
                         </div>
                         <div className="flex-1 flex items-center justify-center">
                           <div className="w-full h-0.5 bg-gray-300 relative">
                             <div className="absolute inset-y-0 right-0 transform translate-x-1">
                               <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                 <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                               </svg>
                             </div>
                           </div>
                         </div>
                         <div className="text-center flex-1">
                           <p className="text-lg font-semibold text-gray-900">{safeFormatString(flight.arrival_city, 'Unknown')}</p>
                           <p className="text-sm text-gray-600">{formatTime(flight.arrival_time)}</p>
                           <p className="text-sm text-gray-600">Arrival</p>
                         </div>
                       </div>
                       <div className="mt-4 text-center">
                         <p className="text-sm text-gray-600">
                           Flight Date: {formatDate(flight.departure_time)}
                         </p>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                   <span className="text-2xl text-gray-400">✈️</span>
                 </div>
                 <h3 className="text-lg font-medium text-gray-900 mb-2">Flight recommendations will appear here</h3>
                 <p className="text-gray-600 mb-4">
                   Flight information will be generated based on your itinerary preferences.
                 </p>
               </div>
             )}
           </div>

           {/* Accommodation Information */}
           <div>
             <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
               <span className="mr-3">🏨</span>
               Accommodation
             </h2>
             
             {ai_generated_plan?.accommodations && ai_generated_plan.accommodations.length > 0 ? (
               <div className="grid gap-6">
                 {ai_generated_plan.accommodations.map((accommodation, index) => (
                   <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                     <div className="flex items-start space-x-4">
                       <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                         <span className="text-2xl">🏨</span>
                       </div>
                       <div className="flex-1">
                         <div className="flex items-start justify-between">
                           <div>
                             <h3 className="text-xl font-semibold text-gray-900 mb-1">{safeFormatString(accommodation.name, 'Hotel Accommodation')}</h3>
                             <p className="text-gray-600 mb-2 flex items-center">
                               <MapPinIcon className="h-4 w-4 mr-1" />
                               {safeFormatString(accommodation.location?.address || accommodation.location, 'Location not specified')}
                             </p>
                             <div className="flex items-center space-x-1 mb-3">
                               {Array.from({ length: 5 }, (_, i) => (
                                 <StarIcon
                                   key={i}
                                   className={`h-5 w-5 ${
                                     i < Math.floor(safeFormatNumber(accommodation.rating, 4)) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                   }`}
                                 />
                               ))}
                               <span className="text-sm text-gray-600 ml-2">({safeFormatNumber(accommodation.rating, 4)}/5)</span>
                             </div>
                           </div>
                           <div className="text-right">
                             <p className="text-2xl font-bold text-gray-900">{formatCurrency(safeFormatNumber(accommodation.total_price))}</p>
                             <p className="text-sm text-gray-600">{formatCurrency(safeFormatNumber(accommodation.price_per_night))}/night</p>
                           </div>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                           <div className="bg-gray-50 rounded-lg p-3">
                             <p className="text-sm font-medium text-gray-900">Check-in</p>
                             <p className="text-sm text-gray-600">{formatDate(accommodation.check_in)}</p>
                           </div>
                           <div className="bg-gray-50 rounded-lg p-3">
                             <p className="text-sm font-medium text-gray-900">Check-out</p>
                             <p className="text-sm text-gray-600">{formatDate(accommodation.check_out)}</p>
                           </div>
                         </div>
                         
                         {accommodation.amenities && accommodation.amenities.length > 0 && (
                           <div className="mt-4">
                             <p className="text-sm font-medium text-gray-900 mb-2">Amenities</p>
                             <div className="flex flex-wrap gap-2">
                               {accommodation.amenities.map((amenity, amenityIndex) => (
                                 <span
                                   key={amenityIndex}
                                   className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                                 >
                                   {amenity}
                                 </span>
                               ))}
                             </div>
                           </div>
                         )}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                   <span className="text-2xl text-gray-400">🏨</span>
                 </div>
                 <h3 className="text-lg font-medium text-gray-900 mb-2">Hotel recommendations will appear here</h3>
                 <p className="text-gray-600 mb-4">
                   Hotel recommendations will be generated based on your preferences and budget.
                 </p>
               </div>
             )}
           </div>

           {/* Activities & Attractions */}
           <div>
             <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
               <span className="mr-3">🎯</span>
               Activities & Attractions
             </h2>
             
             {ai_generated_plan?.activities && ai_generated_plan.activities.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {ai_generated_plan.activities.map((activity, index) => (
                   <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                     <div className="flex items-start space-x-4">
                       <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                         <span className="text-purple-600 font-bold">Day {safeFormatNumber(activity.day, index + 1)}</span>
                       </div>
                       <div className="flex-1">
                         <div className="flex items-start justify-between mb-2">
                           <h3 className="font-semibold text-gray-900">{safeFormatString(activity.activity, 'Activity')}</h3>
                           <span className="text-sm font-medium text-gray-900">{formatCurrency(safeFormatNumber(activity.price))}</span>
                         </div>
                         <p className="text-gray-600 text-sm mb-2 flex items-center">
                           <MapPinIcon className="h-4 w-4 mr-1" />
                           {safeFormatString(activity.location?.name || activity.location, 'Location')}
                         </p>
                         <p className="text-gray-600 text-sm mb-2 flex items-center">
                           <ClockIcon className="h-4 w-4 mr-1" />
                           {safeFormatString(activity.time, 'Time')} • {safeFormatString(activity.duration, 'Duration')}
                         </p>
                         <p className="text-gray-700 text-sm">{safeFormatString(activity.description, 'Activity description')}</p>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                   <span className="text-2xl text-gray-400">🎯</span>
                 </div>
                 <h3 className="text-lg font-medium text-gray-900 mb-2">Activities will appear here</h3>
                 <p className="text-gray-600 mb-4">
                   Activity recommendations will be generated based on your travel style and interests.
                 </p>
               </div>
             )}
           </div>

           {/* Transportation */}
           <div>
             <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
               <span className="mr-3">🚗</span>
               Transportation & Getting Around
             </h2>
             
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                   <div className="text-3xl mb-2">🚕</div>
                   <h4 className="font-medium text-blue-900 mb-2">Airport Transfer</h4>
                   <p className="text-blue-700 text-sm">Taxi, ride-share, or shuttle services from/to airport</p>
                   <p className="text-blue-800 font-medium mt-2">~$25-50</p>
                 </div>
                 
                 <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                   <div className="text-3xl mb-2">🚇</div>
                   <h4 className="font-medium text-green-900 mb-2">Public Transport</h4>
                   <p className="text-green-700 text-sm">Metro, bus, and local transportation passes</p>
                   <p className="text-green-800 font-medium mt-2">~$5-15/day</p>
                 </div>
                 
                 <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                   <div className="text-3xl mb-2">🚶</div>
                   <h4 className="font-medium text-orange-900 mb-2">Walking & Cycling</h4>
                   <p className="text-orange-700 text-sm">Explore the city on foot or rent bikes</p>
                   <p className="text-orange-800 font-medium mt-2">Free - $10/day</p>
                 </div>
               </div>
               
               <div className="mt-6 bg-gray-50 rounded-lg p-4">
                 <h4 className="font-medium text-gray-900 mb-2">💡 Transportation Tips</h4>
                 <ul className="text-gray-700 text-sm space-y-1">
                   <li>• Download local transport apps for real-time schedules</li>
                   <li>• Consider day passes for unlimited public transport</li>
                   <li>• Book airport transfers in advance for better rates</li>
                   <li>• Walking is often the best way to explore city centers</li>
                 </ul>
               </div>
             </div>
           </div>
         </div>
       )}

       {activeTab === 'itinerary' && (
         <DailySchedule dailyItinerary={ai_generated_plan?.daily_itinerary || []} />
       )}

       {activeTab === 'budget' && (
         <BudgetBreakdown 
           budgetBreakdown={budget_breakdown} 
           totalBudget={safeFormatNumber(trip_details?.total_budget)}
         />
       )}
     </div>
   </div>
 );
}