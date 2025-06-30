// travel-ai-frontend/src/components/FlightBooking.js
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { 
  MagnifyingGlassIcon, 
  PlaneDepartureIcon, 
  PlaneArrivalIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UsersIcon 
} from '@heroicons/react/24/outline';
import { flightAPI } from '../lib/api';
import { formatCurrency, formatTime } from '../lib/utils';
import toast from 'react-hot-toast';

const FlightBooking = ({ onBookingComplete }) => {
  const [searchData, setSearchData] = useState({
    source: '',
    destination: '',
    departDate: '',
    returnDate: '',
    passengers: 1,
    cabinClass: 'ECONOMY'
  });
  const [flights, setFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [step, setStep] = useState('search'); // search, select, book, confirm

  const handleSearch = async () => {
    if (!searchData.source || !searchData.destination || !searchData.departDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await flightAPI.search(searchData);
      setFlights(response.data.flights);
      setStep('select');
      toast.success(`Found ${response.data.flights.length} flights`);
    } catch (error) {
      toast.error('Flight search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFlightSelect = (flight) => {
    setSelectedFlight(flight);
    setStep('book');
  };

  const handleBooking = async (travelerInfo, paymentInfo) => {
    setBooking(true);
    try {
      const response = await flightAPI.book({
        flightOffer: selectedFlight,
        travelerInfo,
        paymentInfo
      });
      
      toast.success('Flight booked successfully!');
      setStep('confirm');
      
      if (onBookingComplete) {
        onBookingComplete(response.data.booking);
      }
    } catch (error) {
      toast.error('Booking failed');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Search Form */}
      {step === 'search' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Search Flights</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <input
                type="text"
                placeholder="HYD, BOM, DEL..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={searchData.source}
                onChange={(e) => setSearchData({...searchData, source: e.target.value.toUpperCase()})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <input
                type="text"
                placeholder="VTZ, LON, SIN..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={searchData.destination}
                onChange={(e) => setSearchData({...searchData, destination: e.target.value.toUpperCase()})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Departure</label>
              <input
                type="date"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={searchData.departDate}
                onChange={(e) => setSearchData({...searchData, departDate: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Return (Optional)</label>
              <input
                type="date"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={searchData.returnDate}
                onChange={(e) => setSearchData({...searchData, returnDate: e.target.value})}
                min={searchData.departDate}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Passengers</label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={searchData.passengers}
                onChange={(e) => setSearchData({...searchData, passengers: parseInt(e.target.value)})}
              >
                {[1,2,3,4,5,6,7,8,9].map(num => (
                  <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={searchData.cabinClass}
                onChange={(e) => setSearchData({...searchData, cabinClass: e.target.value})}
              >
                <option value="ECONOMY">Economy</option>
                <option value="PREMIUM_ECONOMY">Premium Economy</option>
                <option value="BUSINESS">Business</option>
                <option value="FIRST">First Class</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <MagnifyingGlassIcon className="h-5 w-5" />
                <span>Search Flights</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Flight Results */}
      {step === 'select' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Available Flights</h2>
            <button 
              onClick={() => setStep('search')}
              className="text-blue-600 hover:text-blue-700"
            >
              Modify Search
            </button>
          </div>
          
          {flights.map((flight, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {/* Outbound Flight */}
                  <div className="flex items-center space-x-6 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold">{flight.outbound.departure.iataCode}</div>
                      <div className="text-sm text-gray-600">{formatTime(flight.outbound.departure.at)}</div>
                    </div>
                    
                    <div className="flex-1 flex items-center">
                      <div className="flex-1 h-0.5 bg-gray-300"></div>
                      <PlaneDepartureIcon className="h-5 w-5 text-gray-400 mx-2" />
                      <div className="flex-1 h-0.5 bg-gray-300"></div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-semibold">{flight.outbound.arrival.iataCode}</div>
                      <div className="text-sm text-gray-600">{formatTime(flight.outbound.arrival.at)}</div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4 inline mr-1" />
                      {flight.outbound.duration}
                    </div>
                  </div>
                  
                  {/* Return Flight (if exists) */}
                  {flight.return && (
                    <div className="flex items-center space-x-6 border-t pt-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold">{flight.return.departure.iataCode}</div>
                        <div className="text-sm text-gray-600">{formatTime(flight.return.departure.at)}</div>
                      </div>
                      
                      <div className="flex-1 flex items-center">
                        <div className="flex-1 h-0.5 bg-gray-300"></div>
                        <PlaneArrivalIcon className="h-5 w-5 text-gray-400 mx-2" />
                        <div className="flex-1 h-0.5 bg-gray-300"></div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-semibold">{flight.return.arrival.iataCode}</div>
                        <div className="text-sm text-gray-600">{formatTime(flight.return.arrival.at)}</div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <ClockIcon className="h-4 w-4 inline mr-1" />
                        {flight.return.duration}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="ml-6 text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(flight.price.total)}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    {formatCurrency(flight.price.base)} × {searchData.passengers}
                  </div>
                  <button
                    onClick={() => handleFlightSelect(flight)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Select Flight
                  </button>
                </div>
              </div>
              
              <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
                <span>{flight.airline}</span>
                <span>•</span>
                <span>{flight.flightNumber}</span>
                {flight.outbound.stops > 0 && (
                  <>
                    <span>•</span>
                    <span>{flight.outbound.stops} stop{flight.outbound.stops > 1 ? 's' : ''}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Form */}
      {step === 'book' && selectedFlight && (
        <FlightBookingForm 
          flight={selectedFlight}
          passengers={searchData.passengers}
          onBook={handleBooking}
          loading={booking}
          onBack={() => setStep('select')}
        />
      )}

      {/* Confirmation */}
      {step === 'confirm' && (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600 mb-6">Your flight has been successfully booked.</p>
          <button
            onClick={() => setStep('search')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Book Another Flight
          </button>
        </div>
      )}
    </div>
  );
};

export default FlightBooking;