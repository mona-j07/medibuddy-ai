import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Utensils } from 'lucide-react';

interface DietPlan {
  breakfast: { dish: string; calories: string };
  lunch: { dish: string; calories: string };
  dinner: { dish: string; calories: string };
  snacks: { dish: string; calories: string };
}

export const DietPlan: React.FC = () => {
  const { user } = useAuth();
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [user]);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/recommendations/${user?.id}`);
      const data = await response.json();
      setDietPlan(data.diet_plan);
    } catch (error) {
      console.error('Error fetching diet plan:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!dietPlan || !dietPlan.breakfast) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Utensils /> Diet Plan
        </h2>
        <p className="text-center text-gray-500 py-8">Complete your BMI calculation to get personalized diet recommendations</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <Utensils /> Recommended Diet Plan
      </h2>
      <div className="space-y-3">
        <div className="p-3 bg-orange-50 dark:bg-gray-700 rounded-lg">
          <div className="font-semibold text-orange-600 dark:text-orange-400">Breakfast</div>
          <div className="dark:text-white">{dietPlan.breakfast.dish}</div>
          <div className="text-sm text-gray-500">{dietPlan.breakfast.calories}</div>
        </div>
        <div className="p-3 bg-green-50 dark:bg-gray-700 rounded-lg">
          <div className="font-semibold text-green-600 dark:text-green-400">Lunch</div>
          <div className="dark:text-white">{dietPlan.lunch.dish}</div>
          <div className="text-sm text-gray-500">{dietPlan.lunch.calories}</div>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-gray-700 rounded-lg">
          <div className="font-semibold text-blue-600 dark:text-blue-400">Dinner</div>
          <div className="dark:text-white">{dietPlan.dinner.dish}</div>
          <div className="text-sm text-gray-500">{dietPlan.dinner.calories}</div>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-gray-700 rounded-lg">
          <div className="font-semibold text-purple-600 dark:text-purple-400">Snacks</div>
          <div className="dark:text-white">{dietPlan.snacks.dish}</div>
          <div className="text-sm text-gray-500">{dietPlan.snacks.calories}</div>
        </div>
      </div>
    </div>
  );
};