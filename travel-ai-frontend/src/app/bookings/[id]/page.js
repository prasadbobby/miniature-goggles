'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CreditCardIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  PrinterIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { bookingAPI } from '../../../../lib/api';
import { formatCurrency, formatDate } from '../../../../lib/utils';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import Modal from '../../../../components/common/Modal';
import toast from 'react-hot-toast';

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [params.id]);

  const fetchBooking = async () => {
    try {
      const response = await bookingAPI.getById(params.id);
      setBooking(response.data.booking);
    } catch (error) {
      toast.error('Failed to load booking details');
      router.push('/bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    setCancelLoading(true);
    try {
      await bookingAPI.cancel(params.id);
      toast.success('Booking cancelled successfully');
      setShowCancelModal(false);
      fetchBooking(); // Refresh booking data
    } catch (error) {
      toast.error('Failed to cancel booking');
    } finally {
      setCancelLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Booking link copied to clipboard!');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-6 w-6 text-yellow-500" />;
      case 'cancelled':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-6 w-6 text-blue-500" />;
      default:
        return <ClockIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking not found</h2>
          <Link href="/bookings" className="btn-primary">
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  const { booking_details, payment_info, booking_type } = booking;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/bookings"
              className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
              <p className="text-gray-600">Confirmation: {booking_details.confirmation_number}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleShare}
              className="btn-secondary flex items-center space-x-2"
            >
              <ShareIcon className="h-4 w-4" />
              <span>Share</span>
            </button>
            <button
              onClick={handlePrint}
              className="btn-secondary flex items-center space-x-2"
            >
              <PrinterIcon className="h-4 w-4" />
              <span>Print</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Overview */}
            <div className="card p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span className="text-3xl">{getTypeIcon(booking_type)}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 capitalize">
                    {booking_type} Booking
                  </h2>
                  <p className="text-gray-600">
                    Booked on {formatDate(booking_details.booking_date)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmation Number
                    </label>
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono">
                        {booking_details.confirmation_number}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(booking_details.confirmation_number);
                          toast.success('Copied to clipboard!');
                        }}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  {booking_details.service_date && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Date
                      </label>
                      <div className="flex items-center space-x-2 text-gray-900">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatDate(booking_details.service_date)}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provider
                    </label>
                    <p className="text-gray-900">{booking_details.provider || 'TravelAI'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                     Total Amount
                   </label>
                   <p className="text-2xl font-bold text-gray-900">
                     {formatCurrency(booking_details.total_price || 0)}
                   </p>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Payment Status
                   </label>
                   <div className="flex items-center space-x-2">
                     {getStatusIcon(payment_info?.payment_status)}
                     <span className="capitalize font-medium">
                       {payment_info?.payment_status}
                     </span>
                   </div>
                 </div>

                 {payment_info?.transaction_id && (
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Transaction ID
                     </label>
                     <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                       {payment_info.transaction_id}
                     </code>
                   </div>
                 )}
               </div>
             </div>
           </div>

           {/* Booking Timeline */}
           <div className="card p-6">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Timeline</h3>
             <div className="space-y-4">
               <div className="flex items-center space-x-4">
                 <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                   <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                 </div>
                 <div>
                   <p className="font-medium text-gray-900">Booking Created</p>
                   <p className="text-sm text-gray-600">
                     {formatDate(booking_details.booking_date)}
                   </p>
                 </div>
               </div>

               {payment_info?.payment_status === 'paid' && (
                 <div className="flex items-center space-x-4">
                   <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                     <CreditCardIcon className="h-4 w-4 text-green-600" />
                   </div>
                   <div>
                     <p className="font-medium text-gray-900">Payment Confirmed</p>
                     <p className="text-sm text-gray-600">
                       Payment processed successfully
                     </p>
                   </div>
                 </div>
               )}

               {booking_details.status === 'confirmed' && (
                 <div className="flex items-center space-x-4">
                   <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                     <CheckCircleIcon className="h-4 w-4 text-green-600" />
                   </div>
                   <div>
                     <p className="font-medium text-gray-900">Booking Confirmed</p>
                     <p className="text-sm text-gray-600">
                       Your booking has been confirmed
                     </p>
                   </div>
                 </div>
               )}

               {booking_details.service_date && new Date(booking_details.service_date) > new Date() && (
                 <div className="flex items-center space-x-4">
                   <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                     <ClockIcon className="h-4 w-4 text-gray-600" />
                   </div>
                   <div>
                     <p className="font-medium text-gray-900">Upcoming Service</p>
                     <p className="text-sm text-gray-600">
                       {formatDate(booking_details.service_date)}
                     </p>
                   </div>
                 </div>
               )}
             </div>
           </div>

           {/* Additional Information */}
           {booking_type === 'flight' && (
             <div className="card p-6">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Flight Information</h3>
               <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                 <p className="text-blue-800 font-medium mb-2">Important Reminders:</p>
                 <ul className="text-blue-700 text-sm space-y-1">
                   <li>• Arrive at the airport 2 hours before domestic flights</li>
                   <li>• Arrive at the airport 3 hours before international flights</li>
                   <li>• Check-in online 24 hours before departure</li>
                   <li>• Ensure your passport is valid for at least 6 months</li>
                 </ul>
               </div>
             </div>
           )}

           {booking_type === 'accommodation' && (
             <div className="card p-6">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Hotel Information</h3>
               <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                 <p className="text-green-800 font-medium mb-2">Check-in Details:</p>
                 <ul className="text-green-700 text-sm space-y-1">
                   <li>• Standard check-in time: 3:00 PM</li>
                   <li>• Standard check-out time: 11:00 AM</li>
                   <li>• Bring a valid photo ID and credit card</li>
                   <li>• Contact hotel directly for early check-in requests</li>
                 </ul>
               </div>
             </div>
           )}
         </div>

         {/* Sidebar */}
         <div className="lg:col-span-1 space-y-6">
           {/* Status Card */}
           <div className="card p-6">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Status</h3>
             <div className="space-y-4">
               <div className={`px-4 py-3 rounded-lg border ${getStatusColor(booking_details.status)}`}>
                 <div className="flex items-center space-x-2">
                   {getStatusIcon(booking_details.status)}
                   <span className="font-semibold capitalize">{booking_details.status}</span>
                 </div>
               </div>

               {booking_details.status === 'confirmed' && booking_details.service_date && (
                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                   <p className="text-blue-800 text-sm">
                     <strong>Ready to go!</strong> Your booking is confirmed and ready for your trip.
                   </p>
                 </div>
               )}

               {booking_details.status === 'pending' && (
                 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                   <p className="text-yellow-800 text-sm">
                     <strong>Pending confirmation.</strong> We're processing your booking and will update you soon.
                   </p>
                 </div>
               )}
             </div>
           </div>

           {/* Actions */}
           <div className="card p-6">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
             <div className="space-y-3">
               {booking_details.status === 'confirmed' && (
                 <button className="w-full btn-primary">
                   Check-in Online
                 </button>
               )}

               {booking_details.status === 'pending' && (
                 <button
                   onClick={() => setShowCancelModal(true)}
                   className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                 >
                   Cancel Booking
                 </button>
               )}

               <button className="w-full btn-secondary">
                 Modify Booking
               </button>

               <button className="w-full btn-secondary">
                 Contact Support
               </button>
             </div>
           </div>

           {/* Contact Information */}
           <div className="card p-6">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
             <div className="space-y-3 text-sm">
               <div>
                 <p className="font-medium text-gray-900">Customer Support</p>
                 <p className="text-gray-600">Available 24/7</p>
                 <p className="text-primary-600">+1 (555) 123-4567</p>
               </div>
               <div>
                 <p className="font-medium text-gray-900">Email Support</p>
                 <p className="text-primary-600">support@travelai.com</p>
               </div>
               <div>
                 <p className="font-medium text-gray-900">Live Chat</p>
                 <p className="text-gray-600">Response within 5 minutes</p>
               </div>
             </div>
           </div>
         </div>
       </div>
     </div>

     {/* Cancel Confirmation Modal */}
     <Modal
       isOpen={showCancelModal}
       onClose={() => setShowCancelModal(false)}
       title="Cancel Booking"
     >
       <div className="p-6">
         <div className="flex items-center space-x-3 mb-4">
           <XCircleIcon className="h-8 w-8 text-red-500" />
           <div>
             <h3 className="font-semibold text-gray-900">Cancel this booking?</h3>
             <p className="text-sm text-gray-600">Confirmation: {booking_details.confirmation_number}</p>
           </div>
         </div>
         
         <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
           <p className="text-red-800 text-sm">
             <strong>Important:</strong> Cancelling this booking may result in cancellation fees. 
             Please review the cancellation policy before proceeding.
           </p>
         </div>

         <div className="flex space-x-4">
           <button
             onClick={() => setShowCancelModal(false)}
             className="flex-1 btn-secondary"
           >
             Keep Booking
           </button>
           <button
             onClick={handleCancelBooking}
             disabled={cancelLoading}
             className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
           >
             {cancelLoading ? 'Cancelling...' : 'Cancel Booking'}
           </button>
         </div>
       </div>
     </Modal>
   </div>
 );
}