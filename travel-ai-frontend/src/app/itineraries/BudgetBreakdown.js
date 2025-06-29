'use client';

import { useState } from 'react';
import { 
  CurrencyDollarIcon, 
  ChartPieIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { formatCurrency } from '../../lib/utils';
import { itineraryAPI } from '../../lib/api';
import toast from 'react-hot-toast';

const BudgetBreakdown = ({ budgetBreakdown, totalBudget, itineraryId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState(totalBudget);
  const [loading, setLoading] = useState(false);

  const budgetItems = [
    { key: 'flights', label: 'Flights', color: 'bg-blue-500', icon: '✈️' },
    { key: 'accommodation', label: 'Accommodation', color: 'bg-green-500', icon: '🏨' },
    { key: 'activities', label: 'Activities', color: 'bg-purple-500', icon: '🎯' },
    { key: 'food', label: 'Food & Dining', color: 'bg-orange-500', icon: '🍽️' },
    { key: 'transportation', label: 'Transportation', color: 'bg-yellow-500', icon: '🚗' },
    { key: 'miscellaneous', label: 'Miscellaneous', color: 'bg-gray-500', icon: '💼' }
  ];

  const handleOptimizeBudget = async () => {
    if (newBudget <= 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }

    setLoading(true);
    try {
      await itineraryAPI.optimizeBudget(itineraryId, { newBudget });
      toast.success('Budget optimized successfully!');
      setIsEditing(false);
      // Reload the page to show updated data
      window.location.reload();
    } catch (error) {
      toast.error('Failed to optimize budget');
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (amount, total) => {
    return total > 0 ? Math.round((amount / total) * 100) : 0;
  };

  const totalSpent = budgetBreakdown?.total_spent || 0;
  const remainingBudget = totalBudget - totalSpent;
  const remainingPercentage = calculatePercentage(remainingBudget, totalBudget);

  return (
    <div className="space-y-8">
      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CurrencyDollarIcon className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Budget</h3>
          <div className="flex items-center justify-center space-x-2">
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(Number(e.target.value))}
                  className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                />
                <button
                  onClick={handleOptimizeBudget}
                  disabled={loading}
                  className="text-green-600 hover:text-green-700"
                >
                  <CheckIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setNewBudget(totalBudget);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBudget)}</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="card p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChartPieIcon className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Spent</h3>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalSpent)}</p>
          <p className="text-sm text-gray-600 mt-1">
            {calculatePercentage(totalSpent, totalBudget)}% of budget
          </p>
        </div>

        <div className="card p-6 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            remainingBudget >= 0 ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <CurrencyDollarIcon className={`h-8 w-8 ${
              remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'
            }`} />
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

      {/* Budget Breakdown */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Budget Breakdown</h3>
        
        {/* Progress Bars */}
        <div className="space-y-4 mb-8">
          {budgetItems.map((item) => {
            const amount = budgetBreakdown?.[item.key] || 0;
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

        {/* Pie Chart Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart Legend */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Category Distribution</h4>
            <div className="space-y-3">
              {budgetItems.map((item) => {
                const amount = budgetBreakdown?.[item.key] || 0;
                const percentage = calculatePercentage(amount, totalSpent);
                
                return (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                      <span className="text-sm font-medium text-gray-900">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">{formatCurrency(amount)}</div>
                      <div className="text-xs text-gray-600">{percentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Budget Tips */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">💡 Budget Tips</h4>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Accommodation:</strong> Book early for better rates and consider alternative accommodations like Airbnb.
                </p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Food:</strong> Mix dining out with local markets and street food for authentic experiences.
                </p>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800">
                  <strong>Activities:</strong> Look for free walking tours and city passes for multiple attractions.
                </p>
              </div>
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Transportation:</strong> Use public transport and consider city bike rentals.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Optimization */}
        {remainingBudget < 0 && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-red-600">⚠️</span>
              <h4 className="font-semibold text-red-900">Budget Exceeded</h4>
            </div>
            <p className="text-sm text-red-800 mb-3">
              Your current itinerary exceeds your budget by {formatCurrency(Math.abs(remainingBudget))}. 
              Consider optimizing your choices or increasing your budget.
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
            >
              Optimize Budget
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetBreakdown;