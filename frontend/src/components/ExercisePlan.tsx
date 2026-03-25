import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Dumbbell } from 'lucide-react';

interface Exercise {
  name: string;
  duration: string;
  benefits: string;
}

export const ExercisePlan: React.FC = () => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [user]);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/recommendations/${user?.id}`);
      const data = await response.json();
      setExercises(data.exercise_plan?.exercises || []);
    } catch (error) {
      console.error('Error fetching exercise plan:', error);
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

  if (exercises.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Dumbbell /> Exercise Plan
        </h2>
        <p className="text-center text-gray-500 py-8">Complete your BMI calculation to get personalized exercise recommendations</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <Dumbbell /> Recommended Exercise Plan
      </h2>
      <div className="space-y-3">
        {exercises.map((ex, idx) => (
          <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="font-semibold dark:text-white">{ex.name}</div>
            <div className="text-sm text-gray-500">{ex.duration}</div>
            <div className="text-xs text-gray-400 mt-1">{ex.benefits}</div>
          </div>
        ))}
      </div>
    </div>
  );
};