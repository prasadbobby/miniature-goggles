'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../providers';
import { itineraryAPI, bookingAPI } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import Link from 'next/link';
import {
  PlusIcon,
  MapIcon,
  CalendarIcon,
  CreditCardIcon,
  ChartBarIcon,
  GlobeAltIcon,
  ClockIcon,
  ArrowTrendingUpIcon  // Changed from TrendingUpIcon
} from '@heroicons/react/24/outline';
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

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalItineraries: 0,
    totalBookings: 0,
    totalSpent: 0,
    upcomingTrips: 0
  });
  const [recentItineraries, setRecentItineraries] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [itinerariesRes, bookingsRes] = await Promise.all([
        itineraryAPI.getAll({ limit: 5 }),
        bookingAPI.getAll({ limit: 5 })
      ]);

      const itineraries = itinerariesRes.data.itineraries || [];
      const bookings = bookingsRes.data.bookings || [];

      setRecentItineraries(itineraries);
      setRecentBookings(bookings);

      // Calculate stats
      const totalSpent = bookings.reduce((sum, booking) => 
        sum + (booking.booking_details?.total_price || 0), 0
      );

      const upcomingTrips = itineraries.filter(itinerary => 
        new Date(itinerary.trip_details?.start_date) > new Date()
      ).length;

      setStats({
        totalItineraries: itineraries.length,
        totalBookings: bookings.length,
        totalSpent,
        upcomingTrips
      });
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      // Don't show error for now, just use empty data
      setStats({
        totalItineraries: 0,
        totalBookings: 0,
        totalSpent: 0,
        upcomingTrips: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      name: 'Plan New Trip',
      description: 'Create a new AI-powered itinerary',
      href: '/itineraries/create',
      icon: PlusIcon,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700'
    },
    {
      name: 'View Itineraries',
      description: 'Manage your travel plans',
      href: '/itineraries',
      icon: MapIcon,
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700'
    },
    {
      name: 'My Bookings',
      description: 'Track your reservations',
      href: '/bookings',
      icon: CreditCardIcon,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700'
    },
    {
      name: 'Travel Analytics',
      description: 'View your travel insights',
      href: '/analytics',
      icon: ChartBarIcon,
      color: 'bg-gradient-to-r from-orange-500 to-orange-600',
      hoverColor: 'hover:from-orange-600 hover:to-orange-700'
    }
  ];

  const statCards = [
    {
      name: 'Total Itineraries',
      value: stats.totalItineraries,
      icon: MapIcon,
      change: '+12%',
      changeType: 'increase'
    },
    {
      name: 'Active Bookings',
      value: stats.totalBookings,
      icon: CreditCardIcon,
      change: '+8%',
      changeType: 'increase'
    },
    {
      name: 'Total Spent',
      value: formatCurrency(stats.totalSpent),
      icon: ArrowTrendingUpIcon,  // Changed from TrendingUpIcon
      change: '+15%',
      changeType: 'increase'
    },
    {
      name: 'Upcoming Trips',
      value: stats.upcomingTrips,
      icon: ClockIcon,
      change: '2 this month',
      changeType: 'neutral'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name || 'Traveler'}! ✈️
              </h1>
              <p className="text-gray-600 mt-2">
                Ready to plan your next adventure? Let's get started!
              </p>
            </div>
            <div className="hidden sm:block">
              <Link
                href="/itineraries/create"
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Plan New Trip</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span className={`text-sm ${
                    stat.changeType === 'increase' ? 'text-green-600' :
                    stat.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-gray-500 text-sm ml-2">from last month</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  href={action.href}
                  className={`${action.color} ${action.hoverColor} text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="h-8 w-8 group-hover:scale-110 transition-transform duration-300" />
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{action.name}</h3>
                  <p className="text-white/80 text-sm">{action.description}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Itineraries */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Itineraries</h3>
                <Link href="/itineraries" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentItineraries.length > 0 ? (
                <div className="space-y-4">
                  {recentItineraries.map((itinerary, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <GlobeAltIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {itinerary.trip_details?.destination}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {formatDate(itinerary.trip_details?.start_date)} - {formatDate(itinerary.trip_details?.end_date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(itinerary.trip_details?.total_budget)}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          itinerary.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          itinerary.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {itinerary.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No itineraries yet</p>
                  <Link href="/itineraries/create" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Create your first itinerary
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
                <Link href="/bookings" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentBookings.length > 0 ? (
                <div className="space-y-4">
                  {recentBookings.map((booking, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <CalendarIcon className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {booking.booking_type} Booking
                        </h4>
                        <p className="text-sm text-gray-600">
                          {booking.booking_details?.confirmation_number}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(booking.booking_details?.total_price || 0)}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          booking.booking_details?.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.booking_details?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {booking.booking_details?.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No bookings yet</p>
                  <Link href="/itineraries" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Start planning to make bookings
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}