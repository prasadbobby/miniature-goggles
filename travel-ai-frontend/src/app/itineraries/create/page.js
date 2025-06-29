'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MapPinIcon, 
  CalendarIcon, 
  CurrencyDollarIcon, 
  UsersIcon,
  SparklesIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { itineraryAPI } from '../../../lib/api';
import { calculateDays } from '../../../lib/utils';
import Link from 'next/link';
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

export default function CreateItineraryPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    totalBudget: '',
    travelers: 1,
    preferences: {
      budget_range: 'mid-range',
      travel_style: 'cultural',
      accommodation_type: 'hotel'
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }

    if (name.includes('preferences.')) {
      const prefKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateStep = (stepNumber) => {
    const newErrors = {};
    
    switch (stepNumber) {
      case 1:
        if (!formData.destination.trim()) {
          newErrors.destination = 'Please enter a destination';
        }
        break;
      case 2:
        if (!formData.startDate) {
          newErrors.startDate = 'Please select a start date';
        }
        if (!formData.endDate) {
          newErrors.endDate = 'Please select an end date';
        }
        if (formData.startDate && formData.endDate) {
          if (new Date(formData.startDate) >= new Date(formData.endDate)) {
            newErrors.endDate = 'End date must be after start date';
          }
          if (new Date(formData.startDate) < new Date()) {
            newErrors.startDate = 'Start date cannot be in the past';
          }
        }
        break;
      case 3:
        if (!formData.totalBudget || formData.totalBudget <= 0) {
          newErrors.totalBudget = 'Please enter a valid budget';
        }
        if (formData.travelers < 1 || formData.travelers > 20) {
          newErrors.travelers = 'Number of travelers must be between 1 and 20';
        }
        break;
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      // Show first error
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
      return false;
    }
    
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    console.log('Starting form submission...');
    console.log('Form data:', formData);
    
    if (!validateStep(3)) {
      console.log('Form validation failed');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Making API call to generate itinerary...');
      
      // Prepare the data for the API
      const apiData = {
        destination: formData.destination.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalBudget: Number(formData.totalBudget),
        travelers: Number(formData.travelers),
        preferences: formData.preferences
      };
      
      console.log('API data being sent:', apiData);
      
      const response = await itineraryAPI.generate(apiData);
      console.log('API response:', response);
      
      if (response.data && response.data.itinerary) {
        toast.success('Itinerary generated successfully!');
        console.log('Redirecting to:', `/itineraries/${response.data.itinerary._id}`);
        router.push(`/itineraries/${response.data.itinerary._id}`);
      } else {
        console.error('Invalid response structure:', response);
        toast.error('Invalid response from server');
      }
    } catch (error) {
      console.error('API Error:', error);
      console.error('Error response:', error.response);
      
      if (error.response) {
        // Server responded with error
        const message = error.response.data?.message || error.response.data?.error || 'Server error occurred';
        toast.error(`Error: ${message}`);
        console.log('Server error details:', error.response.data);
      } else if (error.request) {
        // Network error
        console.error('Network error - no response received');
        toast.error('Network error: Please check if the backend server is running');
      } else {
        // Other error
        console.error('Other error:', error.message);
        toast.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  // Test function to check API connectivity
  const testAPIConnection = async () => {
    try {
      console.log('Testing API connection...');
      const response = await fetch('http://localhost:3001/health');
      if (response.ok) {
        const data = await response.json();
        console.log('Backend is running:', data);
        toast.success('Backend connection successful!');
      } else {
        console.error('Backend health check failed:', response.status);
        toast.error('Backend server is not responding properly');
      }
    } catch (error) {
      console.error('Backend connection test failed:', error);
      toast.error('Cannot connect to backend server. Please make sure it\'s running on port 3001');
    }
  };

  const steps = [
    { number: 1, title: 'Destination', icon: MapPinIcon },
    { number: 2, title: 'Dates', icon: CalendarIcon },
    { number: 3, title: 'Budget & Travelers', icon: CurrencyDollarIcon },
    { number: 4, title: 'Preferences', icon: SparklesIcon }
  ];

  const totalDays = formData.startDate && formData.endDate ? 
    calculateDays(formData.startDate, formData.endDate) : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
       

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/itineraries"
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Trip</h1>
              <p className="text-gray-600">Let AI plan your perfect adventure</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((stepItem, index) => {
              const Icon = stepItem.icon;
              const isActive = step === stepItem.number;
              const isCompleted = step > stepItem.number;
              
              return (
                <div key={stepItem.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    isActive 
                      ? 'border-blue-600 bg-blue-600 text-white' 
                      : isCompleted 
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                      Step {stepItem.number}
                    </p>
                    <p className={`text-sm ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                      {stepItem.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`hidden sm:block w-16 h-0.5 ml-6 ${step > stepItem.number ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Step 1: Destination */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <MapPinIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Where would you like to go?</h2>
                <p className="text-gray-600">Tell us your dream destination</p>
              </div>
              
              <div>
                <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
                  Destination *
                </label>
                <input
                  type="text"
                  id="destination"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  placeholder="e.g., Paris, France or Tokyo, Japan"
                  className={`w-full px-4 py-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg ${
                    errors.destination ? 'border-red-500' : 'border-gray-300'
                  }`}
                  autoFocus
                />
                {errors.destination && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    {errors.destination}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Enter a city, country, or region you'd like to explore
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-900 mb-2">🏙️ City Adventures</h3>
                  <p className="text-sm text-blue-700">Urban exploration, museums, nightlife</p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <h3 className="font-medium text-green-900 mb-2">🏞️ Nature Escapes</h3>
                  <p className="text-sm text-green-700">Mountains, beaches, national parks</p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <h3 className="font-medium text-purple-900 mb-2">🏛️ Cultural Journeys</h3>
                  <p className="text-sm text-purple-700">History, art, local traditions</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Dates */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <CalendarIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">When are you traveling?</h2>
                <p className="text-gray-600">Select your travel dates</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Departure Date *
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.startDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.startDate}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Return Date *
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.endDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.endDate && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.endDate}
                    </p>
                  )}
                </div>
              </div>

              {totalDays > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      Total Duration: {totalDays} {totalDays === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Perfect for a {totalDays <= 3 ? 'weekend getaway' : totalDays <= 7 ? 'week-long adventure' : 'extended vacation'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Budget & Travelers */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <CurrencyDollarIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Budget & Group Size</h2>
                <p className="text-gray-600">Help us plan within your budget</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="totalBudget" className="block text-sm font-medium text-gray-700 mb-2">
                    Total Budget (USD) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      id="totalBudget"
                      name="totalBudget"
                      value={formData.totalBudget}
                      onChange={handleChange}
                      placeholder="2000"
                      min="100"
                      className={`w-full pl-7 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.totalBudget ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.totalBudget && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.totalBudget}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Include flights, accommodation, food, and activities
                  </p>
                </div>

                <div>
                  <label htmlFor="travelers" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Travelers *
                  </label>
                  <select
                    id="travelers"
                    name="travelers"
                    value={formData.travelers}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.travelers ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'traveler' : 'travelers'}
                      </option>
                    ))}
                  </select>
                  {errors.travelers && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.travelers}
                    </p>
                  )}
                </div>
              </div>

              {formData.totalBudget && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Budget Breakdown Estimate</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">${Math.round(formData.totalBudget * 0.3)}</div>
                      <div className="text-gray-600">Flights</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-600">${Math.round(formData.totalBudget * 0.35)}</div>
                      <div className="text-gray-600">Hotels</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-orange-600">${Math.round(formData.totalBudget * 0.25)}</div>
                      <div className="text-gray-600">Food</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-purple-600">${Math.round(formData.totalBudget * 0.1)}</div>
                      <div className="text-gray-600">Activities</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Preferences */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <SparklesIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Customize Your Experience</h2>
                <p className="text-gray-600">Tell us your travel preferences</p>
              </div>

              <div className="space-y-6">
                {/* Budget Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Budget Range
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { value: 'budget', label: 'Budget', desc: 'Affordable options, hostels, local transport', icon: '💰' },
                      { value: 'mid-range', label: 'Mid-Range', desc: '3-4 star hotels, mix of experiences', icon: '🏨' },
                      { value: 'luxury', label: 'Luxury', desc: '5-star hotels, premium experiences', icon: '✨' }
                    ].map(option => (
                      <label key={option.value} className="cursor-pointer">
                        <input
                          type="radio"
                          name="preferences.budget_range"
                          value={option.value}
                          checked={formData.preferences.budget_range === option.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                          formData.preferences.budget_range === option.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className="text-center">
                            <div className="text-2xl mb-2">{option.icon}</div>
                            <div className="font-medium text-gray-900">{option.label}</div>
                            <div className="text-sm text-gray-600 mt-1">{option.desc}</div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Travel Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Travel Style
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { value: 'adventure', label: 'Adventure', desc: 'Outdoor activities, hiking, sports', icon: '🏔️' },
                      { value: 'relaxation', label: 'Relaxation', desc: 'Spas, beaches, leisure', icon: '🏖️' },
                      { value: 'cultural', label: 'Cultural', desc: 'Museums, history, local culture', icon: '🏛️' },
                      { value: 'business', label: 'Business', desc: 'Conferences, meetings, networking', icon: '💼' }
                    ].map(option => (
                      <label key={option.value} className="cursor-pointer">
                        <input
                          type="radio"
                          name="preferences.travel_style"
                          value={option.value}
                          checked={formData.preferences.travel_style === option.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                          formData.preferences.travel_style === option.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className="text-center">
                            <div className="text-2xl mb-2">{option.icon}</div>
                            <div className="font-medium text-gray-900 text-sm">{option.label}</div>
                            <div className="text-xs text-gray-600 mt-1">{option.desc}</div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Accommodation Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Accommodation Preference
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { value: 'hotel', label: 'Hotels', desc: 'Traditional hotel experience', icon: '🏨' },
                      { value: 'hostel', label: 'Hostels', desc: 'Budget-friendly, social', icon: '🏠' },
                      { value: 'apartment', label: 'Apartments', desc: 'Home-like experience', icon: '🏡' },
                      { value: 'resort', label: 'Resorts', desc: 'All-inclusive luxury', icon: '🏖️' }
                    ].map(option => (
                      <label key={option.value} className="cursor-pointer">
                        <input
                          type="radio"
                          name="preferences.accommodation_type"
                          value={option.value}
                          checked={formData.preferences.accommodation_type === option.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                          formData.preferences.accommodation_type === option.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className="text-center">
                            <div className="text-2xl mb-2">{option.icon}</div>
                            <div className="font-medium text-gray-900 text-sm">{option.label}</div>
                            <div className="text-xs text-gray-600 mt-1">{option.desc}</div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-4">Trip Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Destination:</span>
                    <span className="ml-2 font-medium text-blue-900">{formData.destination}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Duration:</span>
                    <span className="ml-2 font-medium text-blue-900">{totalDays} days</span>
                 </div>
                 <div>
                   <span className="text-blue-700">Budget:</span>
                   <span className="ml-2 font-medium text-blue-900">${formData.totalBudget}</span>
                 </div>
                 <div>
                   <span className="text-blue-700">Travelers:</span>
                   <span className="ml-2 font-medium text-blue-900">{formData.travelers}</span>
                 </div>
               </div>
             </div>
           </div>
         )}

         {/* Navigation Buttons */}
         <div className="flex justify-between pt-8">
           <button
             onClick={prevStep}
             disabled={step === 1}
             className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
           >
             Previous
           </button>
           
           {step < 4 ? (
             <button 
               onClick={nextStep} 
               className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
             >
               Next Step
             </button>
           ) : (
             <button
               onClick={handleSubmit}
               disabled={loading}
               className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[200px] justify-center"
             >
               {loading ? (
                 <>
                   <LoadingSpinner size="sm" />
                   <span>Generating...</span>
                 </>
               ) : (
                 <>
                   <SparklesIcon className="h-5 w-5" />
                   <span>Generate Itinerary</span>
                 </>
               )}
             </button>
           )}
         </div>
       </div>
     </div>
   </div>
 );
}