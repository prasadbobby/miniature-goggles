// travel-ai-frontend/src/app/itineraries/create/page.js
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
  ExclamationTriangleIcon,
  ArrowsRightLeftIcon
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
    source: '',
    destination: '',
    startDate: '',
    endDate: '',
    totalBudget: '',
    travelers: 1,
    tripType: 'round-trip',
    preferences: {
      budget_range: 'mid-range',
      travel_style: 'cultural',
      accommodation_type: 'hotel',
      interests: [],
      dietary_restrictions: [],
      mobility_requirements: 'none'
    }
  });

  const popularCities = [
    { name: 'New York, USA', code: 'NYC', region: 'North America' },
    { name: 'London, UK', code: 'LON', region: 'Europe' },
    { name: 'Paris, France', code: 'PAR', region: 'Europe' },
    { name: 'Tokyo, Japan', code: 'TYO', region: 'Asia' },
    { name: 'Dubai, UAE', code: 'DXB', region: 'Middle East' },
    { name: 'Sydney, Australia', code: 'SYD', region: 'Oceania' },
    { name: 'Singapore', code: 'SIN', region: 'Asia' },
    { name: 'Los Angeles, USA', code: 'LAX', region: 'North America' }
  ];

  const interests = [
    'Historical Sites', 'Museums', 'Art Galleries', 'Architecture', 'Food & Dining',
    'Nightlife', 'Shopping', 'Nature & Parks', 'Adventure Sports', 'Beach Activities',
    'Photography', 'Local Culture', 'Festivals & Events', 'Wellness & Spa'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
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

  const handleInterestToggle = (interest) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        interests: prev.preferences.interests.includes(interest)
          ? prev.preferences.interests.filter(i => i !== interest)
          : [...prev.preferences.interests, interest]
      }
    }));
  };

  const swapLocations = () => {
    setFormData(prev => ({
      ...prev,
      source: prev.destination,
      destination: prev.source
    }));
  };

  const validateStep = (stepNumber) => {
    const newErrors = {};
    
    switch (stepNumber) {
      case 1:
        if (!formData.source.trim()) {
          newErrors.source = 'Please enter your departure city';
        }
        if (!formData.destination.trim()) {
          newErrors.destination = 'Please enter your destination';
        }
        if (formData.source.toLowerCase() === formData.destination.toLowerCase()) {
          newErrors.destination = 'Destination must be different from source';
        }
        break;
      case 2:
        if (!formData.startDate) {
          newErrors.startDate = 'Please select a departure date';
        }
        if (!formData.endDate) {
          newErrors.endDate = 'Please select a return date';
        }
        if (formData.startDate && formData.endDate) {
          if (new Date(formData.startDate) >= new Date(formData.endDate)) {
            newErrors.endDate = 'Return date must be after departure date';
          }
          if (new Date(formData.startDate) < new Date()) {
            newErrors.startDate = 'Departure date cannot be in the past';
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
    if (!validateStep(3)) {
      return;
    }

    setLoading(true);
    
    try {
      const apiData = {
        source: formData.source.trim(),
        destination: formData.destination.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalBudget: Number(formData.totalBudget),
        travelers: Number(formData.travelers),
        tripType: formData.tripType,
        preferences: formData.preferences
      };
      
      const response = await itineraryAPI.generate(apiData);
      
      if (response.data && response.data.itinerary) {
        toast.success('Itinerary generated successfully!');
        router.push(`/itineraries/${response.data.itinerary._id}`);
      } else {
        toast.error('Invalid response from server');
      }
    } catch (error) {
      console.error('API Error:', error);
      
      if (error.response) {
        const message = error.response.data?.message || 'Server error occurred';
        toast.error(`Error: ${message}`);
      } else if (error.request) {
        toast.error('Network error: Please check your connection');
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Source & Destination', icon: MapPinIcon },
    { number: 2, title: 'Dates & Duration', icon: CalendarIcon },
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
              <h1 className="text-3xl font-bold text-gray-900">Plan Your Perfect Trip</h1>
              <p className="text-gray-600">Let AI create your personalized travel itinerary</p>
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
          {/* Step 1: Source & Destination */}
          {step === 1 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <MapPinIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Where are you traveling?</h2>
                <p className="text-gray-600">Tell us your departure city and destination</p>
              </div>
              
              <div className="space-y-6">
                {/* Source */}
                <div>
                  <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-2">
                    Departure City *
                  </label>
                  <input
                    type="text"
                    id="source"
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    placeholder="e.g., New York, USA"
                    className={`w-full px-4 py-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg ${
                      errors.source ? 'border-red-500' : 'border-gray-300'
                    }`}
                    autoFocus
                  />
                  {errors.source && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.source}
                    </p>
                  )}
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={swapLocations}
                    className="p-3 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                    title="Swap locations"
                  >
                    <ArrowsRightLeftIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Destination */}
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
                    placeholder="e.g., Paris, France"
                    className={`w-full px-4 py-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg ${
                      errors.destination ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.destination && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.destination}
                    </p>
                  )}
                </div>

                {/* Trip Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Trip Type
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { value: 'round-trip', label: 'Round Trip', desc: 'Return to departure city', icon: '🔄' },
                      { value: 'one-way', label: 'One Way', desc: 'Stay at destination', icon: '➡️' },
                      { value: 'multi-city', label: 'Multi-City', desc: 'Visit multiple cities', icon: '🌍' }
                    ].map(option => (
                      <label key={option.value} className="cursor-pointer">
                        <input
                          type="radio"
                          name="tripType"
                          value={option.value}
                          checked={formData.tripType === option.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                         formData.tripType === option.value
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

               {/* Popular Destinations */}
               <div>
                 <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Destinations</h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   {popularCities.map((city, index) => (
                     <button
                       key={index}
                       type="button"
                       onClick={() => setFormData(prev => ({ ...prev, destination: city.name }))}
                       className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                     >
                       <div className="font-medium text-gray-900 text-sm">{city.name}</div>
                       <div className="text-xs text-gray-500">{city.region}</div>
                     </button>
                   ))}
                 </div>
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
               <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                 <div className="flex items-center space-x-2 mb-2">
                   <CalendarIcon className="h-5 w-5 text-blue-600" />
                   <span className="font-medium text-blue-900">
                     Trip Duration: {totalDays} {totalDays === 1 ? 'day' : 'days'}
                   </span>
                 </div>
                 <p className="text-sm text-blue-700">
                   Perfect for a {totalDays <= 3 ? 'weekend getaway' : totalDays <= 7 ? 'week-long adventure' : 'extended vacation'}
                 </p>
                 <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                   <div className="bg-white/50 rounded p-2 text-center">
                     <div className="font-medium text-blue-900">Nights</div>
                     <div className="text-blue-700">{totalDays - 1}</div>
                   </div>
                   <div className="bg-white/50 rounded p-2 text-center">
                     <div className="font-medium text-blue-900">Weekdays</div>
                     <div className="text-blue-700">{/* Calculate weekdays */}</div>
                   </div>
                   <div className="bg-white/50 rounded p-2 text-center">
                     <div className="font-medium text-blue-900">Weekends</div>
                     <div className="text-blue-700">{/* Calculate weekends */}</div>
                   </div>
                   <div className="bg-white/50 rounded p-2 text-center">
                     <div className="font-medium text-blue-900">Season</div>
                     <div className="text-blue-700">Spring</div>
                   </div>
                 </div>
               </div>
             )}

             {/* Quick Date Suggestions */}
             <div>
               <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Suggestions</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                 {[
                   { label: 'This Weekend', days: 2 },
                   { label: 'Long Weekend', days: 3 },
                   { label: 'One Week', days: 7 },
                   { label: 'Two Weeks', days: 14 }
                 ].map((suggestion, index) => (
                   <button
                     key={index}
                     type="button"
                     onClick={() => {
                       const start = new Date();
                       start.setDate(start.getDate() + 1);
                       const end = new Date(start);
                       end.setDate(start.getDate() + suggestion.days);
                       
                       setFormData(prev => ({
                         ...prev,
                         startDate: start.toISOString().split('T')[0],
                         endDate: end.toISOString().split('T')[0]
                       }));
                     }}
                     className="p-3 text-center border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                   >
                     <div className="font-medium text-gray-900 text-sm">{suggestion.label}</div>
                     <div className="text-xs text-gray-500">{suggestion.days} days</div>
                   </button>
                 ))}
               </div>
             </div>
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
                     step="50"
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
                 <div className="relative">
                   <UsersIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                   <select
                     id="travelers"
                     name="travelers"
                     value={formData.travelers}
                     onChange={handleChange}
                     className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                       errors.travelers ? 'border-red-500' : 'border-gray-300'
                     }`}
                   >
                     {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                       <option key={num} value={num}>
                         {num} {num === 1 ? 'traveler' : 'travelers'}
                       </option>
                     ))}
                   </select>
                 </div>
                 {errors.travelers && (
                   <p className="mt-1 text-sm text-red-600 flex items-center">
                     <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                     {errors.travelers}
                   </p>
                 )}
               </div>
             </div>

             {/* Budget Suggestions */}
             <div>
               <h3 className="text-sm font-medium text-gray-700 mb-3">Budget Suggestions</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {[
                   { range: 'Budget', min: 500, max: 1500, desc: 'Hostels, local transport, street food' },
                   { range: 'Mid-Range', min: 1500, max: 4000, desc: '3-4 star hotels, mix of experiences' },
                   { range: 'Luxury', min: 4000, max: 10000, desc: '5-star hotels, premium experiences' }
                 ].map((budget, index) => (
                   <button
                     key={index}
                     type="button"
                     onClick={() => setFormData(prev => ({ ...prev, totalBudget: budget.min.toString() }))}
                     className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                   >
                     <div className="font-medium text-gray-900">{budget.range}</div>
                     <div className="text-lg font-bold text-blue-600">${budget.min} - ${budget.max}</div>
                     <div className="text-xs text-gray-500 mt-1">{budget.desc}</div>
                   </button>
                 ))}
               </div>
             </div>

             {formData.totalBudget && totalDays > 0 && (
               <div className="bg-gray-50 rounded-lg p-6">
                 <h3 className="font-medium text-gray-900 mb-4">Estimated Budget Breakdown</h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {[
                     { category: 'Flights', percentage: 35, color: 'blue' },
                     { category: 'Hotels', percentage: 30, color: 'green' },
                     { category: 'Food', percentage: 20, color: 'orange' },
                     { category: 'Activities', percentage: 15, color: 'purple' }
                   ].map((item, index) => {
                     const amount = Math.round(formData.totalBudget * (item.percentage / 100));
                     return (
                       <div key={index} className="text-center">
                         <div className={`text-lg font-bold text-${item.color}-600`}>
                           ${amount}
                         </div>
                         <div className="text-sm text-gray-600">{item.category}</div>
                         <div className="text-xs text-gray-500">{item.percentage}%</div>
                       </div>
                     );
                   })}
                 </div>
                 <div className="mt-4 pt-4 border-t border-gray-200">
                   <div className="flex justify-between text-sm">
                     <span className="text-gray-600">Daily average:</span>
                     <span className="font-medium">${Math.round(formData.totalBudget / totalDays)}/day</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-gray-600">Per person:</span>
                     <span className="font-medium">${Math.round(formData.totalBudget / formData.travelers)}</span>
                   </div>
                 </div>
               </div>
             )}
           </div>
         )}

         {/* Step 4: Preferences */}
         {step === 4 && (
           <div className="space-y-8">
             <div className="text-center mb-8">
               <SparklesIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
               <h2 className="text-2xl font-bold text-gray-900 mb-2">Customize Your Experience</h2>
               <p className="text-gray-600">Tell us your travel preferences for a personalized itinerary</p>
             </div>

             <div className="space-y-8">
               {/* Budget Range */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-3">
                   Budget Style
                 </label>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {[
                     { value: 'budget', label: 'Budget', desc: 'Affordable options, great value', icon: '💰' },
                     { value: 'mid-range', label: 'Mid-Range', desc: 'Comfort and quality balance', icon: '🏨' },
                     { value: 'luxury', label: 'Luxury', desc: 'Premium experiences', icon: '✨' }
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

               {/* Interests */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-3">
                   What interests you? (Select multiple)
                 </label>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                   {interests.map((interest, index) => (
                     <button
                       key={index}
                       type="button"
                       onClick={() => handleInterestToggle(interest)}
                       className={`p-3 text-sm rounded-lg border transition-all duration-200 ${
                         formData.preferences.interests.includes(interest)
                           ? 'border-blue-600 bg-blue-50 text-blue-900'
                           : 'border-gray-200 hover:border-gray-300 text-gray-700'
                       }`}
                     >
                       {interest}
                     </button>
                   ))}
                 </div>
                 <p className="text-xs text-gray-500 mt-2">
                   Selected: {formData.preferences.interests.length} interests
                 </p>
               </div>

               {/* Dietary Restrictions */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-3">
                   Dietary Restrictions
                 </label>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   {['None', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'Keto', 'Dairy-Free'].map((diet, index) => (
                     <label key={index} className="cursor-pointer">
                       <input
                         type="checkbox"
                         value={diet}
                         checked={formData.preferences.dietary_restrictions.includes(diet)}
                         onChange={(e) => {
                           const value = e.target.value;
                           setFormData(prev => ({
                             ...prev,
                             preferences: {
                               ...prev.preferences,
                               dietary_restrictions: e.target.checked
                                 ? [...prev.preferences.dietary_restrictions, value]
                                 : prev.preferences.dietary_restrictions.filter(d => d !== value)
                             }
                           }));
                         }}
                         className="sr-only"
                       />
                       <div className={`p-3 text-sm rounded-lg border transition-all duration-200 text-center ${
                         formData.preferences.dietary_restrictions.includes(diet)
                           ? 'border-blue-600 bg-blue-50 text-blue-900'
                           : 'border-gray-200 hover:border-gray-300 text-gray-700'
                       }`}>
                         {diet}
                       </div>
                     </label>
                   ))}
                 </div>
               </div>

               {/* Summary */}
               <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                 <h3 className="font-semibold text-blue-900 mb-4">Trip Summary</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                   <div>
                     <span className="text-blue-700">Route:</span>
                     <span className="ml-2 font-medium text-blue-900">
                       {formData.source} → {formData.destination}
                     </span>
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
                   <div className="md:col-span-2">
                     <span className="text-blue-700">Style:</span>
                     <span className="ml-2 font-medium text-blue-900 capitalize">
                       {formData.preferences.travel_style} • {formData.preferences.budget_range} • {formData.preferences.accommodation_type}
                     </span>
                   </div>
                   {formData.preferences.interests.length > 0 && (
                     <div className="md:col-span-2">
                       <span className="text-blue-700">Interests:</span>
                       <span className="ml-2 font-medium text-blue-900">
                         {formData.preferences.interests.slice(0, 3).join(', ')}
                         {formData.preferences.interests.length > 3 && ` +${formData.preferences.interests.length - 3} more`}
                       </span>
                     </div>
                   )}
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
               className="flex items-center space-x-2 px-8 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-w-[200px] justify-center shadow-lg hover:shadow-xl"
             >
               {loading ? (
                 <>
                   <LoadingSpinner size="sm" />
                   <span>Generating Your Perfect Trip...</span>
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