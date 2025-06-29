'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  CreditCardIcon,
  CalendarIcon,
  MapPinIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { bookingAPI } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
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

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchBookings();
  }, [pagination.page, typeFilter, statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        booking_type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      };

      const response = await bookingAPI.getAll(params);
      const data = response.data;

      setBookings(data.bookings || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || 0
      }));
    } catch (error) {
      console.error('Fetch error:', error);
      // Don't show error toast, just use empty data
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending': return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'cancelled': return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'completed': return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      default: return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'flight': return '✈️';
      case 'accommodation': return '🏨';
      case 'activity': return '🎯';
      case 'package': return '📦';
      default: return '📋';
    }
  };

  const filteredBookings = bookings.filter(booking =>
    booking.booking_details?.confirmation_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.booking_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
              <p className="text-gray-600">Track and manage your travel reservations</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link
                href="/itineraries"
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-200"
              >
                <MapPinIcon className="h-5 w-5" />
                <span>Plan New Trip</span>
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
                placeholder="Search bookings..."
                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <FunnelIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="flight">Flights</option>
                <option value="accommodation">Hotels</option>
                <option value="activity">Activities</option>
                <option value="package">Packages</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-center bg-gray-50 rounded-lg px-4 py-3">
              <span className="text-sm text-gray-600">
                {filteredBookings.length} of {pagination.total} bookings
              </span>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredBookings.length > 0 ? (
          <>
            <div className="space-y-4 mb-8">
              {filteredBookings.map((booking, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Type Icon */}
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">{getTypeIcon(booking.booking_type)}</span>
                      </div>
                      {/* Booking Details */}
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center space-x-3 mb-2">
                         <h3 className="text-lg font-semibold text-gray-900 capitalize">
                           {booking.booking_type} Booking
                         </h3>
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.booking_details?.status)}`}>
                           {booking.booking_details?.status}
                         </span>
                       </div>

                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                         <div className="flex items-center space-x-2">
                           <CreditCardIcon className="h-4 w-4" />
                           <span>Confirmation: {booking.booking_details?.confirmation_number}</span>
                         </div>
                         <div className="flex items-center space-x-2">
                           <CalendarIcon className="h-4 w-4" />
                           <span>
                             Booked: {formatDate(booking.booking_details?.booking_date)}
                           </span>
                         </div>
                         <div className="flex items-center space-x-2">
                           <span className="font-medium">
                             {formatCurrency(booking.booking_details?.total_price || 0)}
                           </span>
                         </div>
                         <div className="flex items-center space-x-2">
                           {getStatusIcon(booking.payment_info?.payment_status)}
                           <span className="capitalize">
                             Payment: {booking.payment_info?.payment_status}
                           </span>
                         </div>
                       </div>

                       {booking.booking_details?.service_date && (
                         <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
                           <CalendarIcon className="h-4 w-4" />
                           <span>
                             Service Date: {formatDate(booking.booking_details.service_date)}
                           </span>
                         </div>
                       )}
                     </div>
                   </div>

                   {/* Actions */}
                   <div className="flex items-center space-x-3 mt-4 lg:mt-0">
                     <Link
                       href={`/bookings/${booking._id}`}
                       className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                     >
                       <EyeIcon className="h-4 w-4" />
                       <span>View</span>
                     </Link>
                     
                     {booking.booking_details?.status === 'confirmed' && (
                       <button className="px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors text-sm">
                         Check-in
                       </button>
                     )}
                     
                     {booking.booking_details?.status === 'pending' && (
                       <button className="px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors text-sm">
                         Cancel
                       </button>
                     )}
                   </div>
                 </div>
               </div>
             ))}
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
                       ? 'bg-blue-600 text-white'
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
           <div className="w-64 h-64 mx-auto mb-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
             <CreditCardIcon className="h-32 w-32 text-blue-600" />
           </div>
           <h3 className="text-2xl font-bold text-gray-900 mb-4">No Bookings Yet</h3>
           <p className="text-gray-600 mb-8 max-w-md mx-auto">
             Start planning your trip to make your first booking. Create an itinerary and book flights, hotels, and activities all in one place.
           </p>
           <Link
             href="/itineraries/create"
             className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-200"
           >
             <MapPinIcon className="h-5 w-5" />
             <span>Plan Your First Trip</span>
           </Link>
         </div>
       )}
     </div>
   </div>
 );
}