'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  MapIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { itineraryAPI } from '../../lib/api';
import { formatCurrency, formatDate, calculateDays } from '../../lib/utils';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

export default function ItinerariesPage() {
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchItineraries();
  }, [pagination.page, statusFilter, sortBy]);

  const fetchItineraries = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sort: sortBy
      };

      const response = await itineraryAPI.getAll(params);
      const data = response.data;

      setItineraries(data.itineraries || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || 0
      }));
    } catch (error) {
      toast.error('Failed to load itineraries');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItinerary) return;

    try {
      await itineraryAPI.delete(selectedItinerary._id);
      toast.success('Itinerary deleted successfully');
      setShowDeleteModal(false);
      setSelectedItinerary(null);
      fetchItineraries();
    } catch (error) {
      toast.error('Failed to delete itinerary');
    }
  };

  const filteredItineraries = itineraries.filter(itinerary =>
    itinerary.trip_details?.destination?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return '✅';
      case 'in_progress': return '🚀';
      case 'completed': return '🎉';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  const calculateTripProgress = (itinerary) => {
    const now = new Date();
    const startDate = new Date(itinerary.trip_details.start_date);
    const endDate = new Date(itinerary.trip_details.end_date);
    
    // If trip hasn't started yet
    if (now < startDate) {
      const daysUntilTrip = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
      if (daysUntilTrip <= 30) {
        return { percentage: 75, label: `Starts in ${daysUntilTrip} days`, color: 'bg-blue-500' };
      } else if (daysUntilTrip <= 60) {
        return { percentage: 50, label: `Starts in ${daysUntilTrip} days`, color: 'bg-yellow-500' };
      } else {
        return { percentage: 25, label: `Starts in ${daysUntilTrip} days`, color: 'bg-gray-500' };
      }
    }
    
    // If trip is currently happening
    if (now >= startDate && now <= endDate) {
      const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
      const daysPassed = (now - startDate) / (1000 * 60 * 60 * 24);
      const percentage = Math.min(Math.round((daysPassed / totalDays) * 100), 100);
      return { percentage, label: 'Trip in progress', color: 'bg-green-500' };
    }
    
    // If trip is completed
    const daysAgo = Math.ceil((now - endDate) / (1000 * 60 * 60 * 24));
    return { percentage: 100, label: `Completed ${daysAgo} days ago`, color: 'bg-purple-500' };
  };

  const getTripStatus = (itinerary) => {
    const now = new Date();
    const startDate = new Date(itinerary.trip_details.start_date);
    const endDate = new Date(itinerary.trip_details.end_date);
    
    if (itinerary.status === 'cancelled') return 'cancelled';
    if (now < startDate) return 'confirmed';
    if (now >= startDate && now <= endDate) return 'in_progress';
    if (now > endDate) return 'completed';
    return itinerary.status;
  };

  const getTripTypeLabel = (itinerary) => {
    const now = new Date();
    const startDate = new Date(itinerary.trip_details.start_date);
    const endDate = new Date(itinerary.trip_details.end_date);
    const totalDays = calculateDays(startDate, endDate);
    
    if (now < startDate) {
      const daysUntilTrip = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
      if (daysUntilTrip <= 7) return 'Upcoming Soon';
      if (daysUntilTrip <= 30) return 'Upcoming';
      return 'Planned';
    }
    
    if (now >= startDate && now <= endDate) {
      return 'Active Trip';
    }
    
    return 'Past Trip';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Itineraries</h1>
              <p className="text-gray-600">Manage and explore your travel plans</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link
                href="/itineraries/create"
                className="btn-primary flex items-center space-x-2"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Create New Trip</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search destinations..."
                className="pl-10 input-field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <FunnelIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                className="pl-10 input-field"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <select
                className="input-field"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="createdAt">Latest First</option>
                <option value="-createdAt">Oldest First</option>
                <option value="trip_details.start_date">Start Date</option>
                <option value="trip_details.total_budget">Budget</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-center bg-gray-50 rounded-lg px-4 py-3">
              <span className="text-sm text-gray-600">
                {filteredItineraries.length} of {pagination.total} trips
              </span>
            </div>
          </div>
        </div>

        {/* Itineraries Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredItineraries.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredItineraries.map((itinerary, index) => {
                const dynamicStatus = getTripStatus(itinerary);
                const progress = calculateTripProgress(itinerary);
                const tripType = getTripTypeLabel(itinerary);
                
                return (
                  <div key={index} className="card group hover:shadow-lg transition-all duration-300">
                    {/* Card Header */}
                    <div className="relative h-48 bg-gradient-to-br from-primary-500 to-primary-700 rounded-t-xl">
                      <div className="absolute inset-0 bg-black/20 rounded-t-xl"></div>
                      <div className="absolute top-4 left-4 right-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(dynamicStatus)}`}>
                              {getStatusIcon(dynamicStatus)} {dynamicStatus.replace('_', ' ')}
                            </span>
                            <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white">
                              {tripType}
                            </span>
                          </div>
                          <div className="flex space-x-1">
                            <Link
                              href={`/itineraries/${itinerary._id}`}
                              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                            >
                              <EyeIcon className="h-4 w-4 text-white" />
                            </Link>
                            <Link
                              href={`/itineraries/${itinerary._id}/edit`}
                              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                            >
                              <PencilIcon className="h-4 w-4 text-white" />
                            </Link>
                            <button
                              onClick={() => {
                                setSelectedItinerary(itinerary);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 bg-white/20 rounded-lg hover:bg-red-500/80 transition-colors"
                            >
                              <TrashIcon className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl font-bold text-white mb-1">
                          {itinerary.trip_details?.destination}
                        </h3>
                        <p className="text-white/80 text-sm">
                          {calculateDays(itinerary.trip_details?.start_date, itinerary.trip_details?.end_date)} days trip
                        </p>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6">
                      <div className="space-y-4">
                        {/* Dates */}
                        <div className="flex items-center space-x-2 text-gray-600">
                          <CalendarIcon className="h-4 w-4" />
                          <span className="text-sm">
                            {formatDate(itinerary.trip_details?.start_date, { month: 'short', day: 'numeric' })} - {formatDate(itinerary.trip_details?.end_date, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>

                        {/* Budget */}
                        <div className="flex items-center space-x-2 text-gray-600">
                          <CurrencyDollarIcon className="h-4 w-4" />
                          <span className="text-sm">
                            Budget: {formatCurrency(itinerary.trip_details?.total_budget)}
                          </span>
                        </div>

                        {/* Travelers */}
                        <div className="flex items-center space-x-2 text-gray-600">
                          <MapIcon className="h-4 w-4" />
                          <span className="text-sm">
                            {itinerary.trip_details?.travelers} {itinerary.trip_details?.travelers === 1 ? 'traveler' : 'travelers'}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-600">Trip Progress</span>
                            <span className="text-xs text-gray-600">
                              {progress.percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${progress.color}`}
                              style={{ width: `${progress.percentage}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{progress.label}</p>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-6 pb-6">
                      <Link
                        href={`/itineraries/${itinerary._id}`}
                        className="w-full btn-outline text-center block py-2 group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 transition-all duration-300"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                    className={`px-3 py-2 rounded-lg ${
                      pageNum === pagination.page
                        ? 'bg-primary-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="w-64 h-64 mx-auto mb-8 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
              <MapIcon className="h-32 w-32 text-primary-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Itineraries Yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start planning your next adventure! Create your first AI-powered itinerary and discover amazing destinations.
            </p>
            <Link
              href="/itineraries/create"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Create Your First Trip</span>
            </Link>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Itinerary"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete the itinerary for{' '}
            <span className="font-semibold">{selectedItinerary?.trip_details?.destination}</span>?
            This action cannot be undone.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}