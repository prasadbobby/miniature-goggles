'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  SparklesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { itineraryAPI } from '../../../../lib/api';
import { calculateDays } from '../../../../lib/utils';
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

export default function EditItineraryPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    fetchItinerary();
  }, [params.id]);

  const fetchItinerary = async () => {
    try {
      const response = await itineraryAPI.getById(params.id);
      const itinerary = response.data.itinerary;
      
      // Convert dates to YYYY-MM-DD format for input fields
      const startDate = new Date(itinerary.trip_details.start_date).toISOString().split('T')[0];
      const endDate = new Date(itinerary.trip_details.end_date).toISOString().split('T')[0];
      
      setFormData({
        destination: itinerary.trip_details.destination,
        startDate: startDate,
        endDate: endDate,
        totalBudget: itinerary.trip_details.total_budget,
        travelers: itinerary.trip_details.travelers,
        preferences: {
          budget_range: itinerary.preferences?.budget_range || 'mid-range',
          travel_style: itinerary.preferences?.travel_style || 'cultural',
          accommodation_type: itinerary.preferences?.accommodation_type || 'hotel'
        }
      });
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load itinerary');
      router.push('/itineraries');
    } finally {
      setLoading(false);
    }
  };

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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.destination.trim()) {
      newErrors.destination = 'Please enter a destination';
    }
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
    }
    if (!formData.totalBudget || formData.totalBudget <= 0) {
      newErrors.totalBudget = 'Please enter a valid budget';
    }
    if (formData.travelers < 1 || formData.travelers > 20) {
      newErrors.travelers = 'Number of travelers must be between 1 and 20';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        trip_details: {
          destination: formData.destination.trim(),
          start_date: formData.startDate,
          end_date: formData.endDate,
          total_budget: Number(formData.totalBudget),
          travelers: Number(formData.travelers),
          total_days: calculateDays(formData.startDate, formData.endDate)
        },
        preferences: formData.preferences
      };

      await itineraryAPI.update(params.id, updateData);
      toast.success('Itinerary updated successfully!');
      router.push(`/itineraries/${params.id}`);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const totalDays = formData.startDate && formData.endDate ? 
    calculateDays(formData.startDate, formData.endDate) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href={`/itineraries/${params.id}`}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Itinerary</h1>
              <p className="text-gray-600">Update your travel plans</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
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
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
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

                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
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
                    End Date *
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={formData.startDate}
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

              {totalDays > 0 && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 font-medium">
                    Trip Duration: {totalDays} {totalDays === 1 ? 'day' : 'days'}
                  </p>
                </div>
              )}
            </div>

            {/* Preferences */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Travel Preferences</h2>
              
              <div className="space-y-6">
                {/* Budget Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Budget Range
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { value: 'budget', label: 'Budget', desc: 'Affordable options', icon: '💰' },
                      { value: 'mid-range', label: 'Mid-Range', desc: 'Comfort and quality', icon: '🏨' },
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
                      { value: 'adventure', label: 'Adventure', icon: '🏔️' },
                      { value: 'relaxation', label: 'Relaxation', icon: '🏖️' },
                      { value: 'cultural', label: 'Cultural', icon: '🏛️' },
                      { value: 'business', label: 'Business', icon: '💼' }
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
                        <div className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                          formData.preferences.travel_style === option.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className="text-2xl mb-2">{option.icon}</div>
                          <div className="font-medium text-gray-900 text-sm">{option.label}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Accommodation Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Accommodation Type
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { value: 'hotel', label: 'Hotels', icon: '🏨' },
                      { value: 'hostel', label: 'Hostels', icon: '🏠' },
                      { value: 'apartment', label: 'Apartments', icon: '🏡' },
                      { value: 'resort', label: 'Resorts', icon: '🏖️' }
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
                        <div className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                          formData.preferences.accommodation_type === option.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className="text-2xl mb-2">{option.icon}</div>
                          <div className="font-medium text-gray-900 text-sm">{option.label}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-8 border-t border-gray-200">
            <Link
              href={`/itineraries/${params.id}`}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}