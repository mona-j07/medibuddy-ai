import React, { useState, useEffect } from 'react';
import { dietService } from '../services/dietService';
import { useAuth } from '../contexts/AuthContext';
import { 
  Utensils, 
  Dumbbell, 
  MapPin, 
  DollarSign, 
  RefreshCw,
  ChefHat,
  Clock,
  Flame,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DietRecommendationProps {
  userBMI?: any;
  userAge?: number;
  userGender?: string;
}

export const DietRecommendation: React.FC<DietRecommendationProps> = ({ 
  userBMI, 
  userAge = 30,
  userGender = 'male'
}) => {
  const { user } = useAuth();
  const [selectedRegion, setSelectedRegion] = useState<string>('south_india');
  const [selectedBudget, setSelectedBudget] = useState<string>('medium');
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [exercisePlan, setExercisePlan] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'diet' | 'exercise'>('diet');

  const regions = dietService.getAvailableRegions();
  const budgets = dietService.getAvailableBudgets();

  // Get BMI category
  const getBMICategory = (): string => {
    if (!userBMI) return 'normal';
    const bmi = userBMI.bmi || userBMI;
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
  };

  // Get age group
  const getAgeGroup = (): string => {
    const age = userAge || user?.age || 30;
    if (age < 2) return 'infant';
    if (age < 5) return 'toddler';
    if (age < 13) return 'child';
    if (age < 20) return 'adolescent';
    if (age < 65) return 'adult';
    return 'senior';
  };

  // Fetch recommendations
  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const category = getBMICategory();
      const ageGroup = getAgeGroup();
      
      // Get diet recommendation
      const diet = await dietService.getDietRecommendation(
        selectedRegion,
        category,
        selectedBudget
      );
      
      if (diet) {
        setDietPlan(diet);
      } else {
        // Fallback diet plan
        setDietPlan({
          breakfast: { dish: 'Balanced Breakfast', calories: '300-400 kcal' },
          lunch: { dish: 'Balanced Lunch', calories: '500-600 kcal' },
          dinner: { dish: 'Light Dinner', calories: '400-500 kcal' },
          snacks: { dish: 'Healthy Snacks', calories: '150-200 kcal' }
        });
      }

      // Get exercise recommendation
      const exercise = await dietService.getExerciseRecommendation(
        ageGroup,
        category
      );
      
      if (exercise) {
        setExercisePlan(exercise);
      } else {
        // Fallback exercise plan
        setExercisePlan({
          exercises: [
            { name: 'Walking', duration: '30 minutes', benefits: 'Cardiovascular health' },
            { name: 'Stretching', duration: '15 minutes', benefits: 'Flexibility' },
            { name: 'Basic Strength', duration: '20 minutes', benefits: 'Muscle tone' }
          ]
        });
      }
      
      toast.success('Recommendations updated!');
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  // Load recommendations on mount and when selections change
  useEffect(() => {
    fetchRecommendations();
  }, [selectedRegion, selectedBudget]);

  // Get calorie color based on value
  const getCalorieColor = (calories: string) => {
    const calValue = parseInt(calories);
    if (isNaN(calValue)) return 'text-gray-500';
    if (calValue < 300) return 'text-green-600';
    if (calValue < 500) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <ChefHat className="text-orange-600" /> Personalized Recommendations
        </h2>
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 transition disabled:opacity-50"
          title="Refresh recommendations"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* User Info Badge */}
      {userBMI && (
        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Your BMI Category:</span>
            <span className={`font-semibold px-2 py-1 rounded ${
              getBMICategory() === 'normal' ? 'bg-green-100 text-green-700' :
              getBMICategory() === 'underweight' ? 'bg-yellow-100 text-yellow-700' :
              getBMICategory() === 'overweight' ? 'bg-orange-100 text-orange-700' :
              'bg-red-100 text-red-700'
            }`}>
              {getBMICategory().toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Selection Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Region Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <MapPin size={16} className="inline mr-2" /> Select Region
          </label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {regions.map(region => (
              <option key={region} value={region}>
                {dietService.formatRegionName(region)}
              </option>
            ))}
          </select>
        </div>

        {/* Budget Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <DollarSign size={16} className="inline mr-2" /> Budget Level
          </label>
          <select
            value={selectedBudget}
            onChange={(e) => setSelectedBudget(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {budgets.map(budget => (
              <option key={budget} value={budget}>
                {dietService.formatBudgetName(budget)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('diet')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'diet'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Utensils size={16} className="inline mr-2" />
          Diet Plan
        </button>
        <button
          onClick={() => setActiveTab('exercise')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'exercise'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Dumbbell size={16} className="inline mr-2" />
          Exercise Plan
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Diet Plan Content */}
      {!loading && activeTab === 'diet' && dietPlan && (
        <div className="space-y-4">
          {/* Breakfast */}
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-orange-600 dark:text-orange-400 text-lg">Breakfast</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Flame size={14} />
                <span className={getCalorieColor(dietPlan.breakfast?.calories)}>
                  {dietPlan.breakfast?.calories || '300-400 kcal'}
                </span>
              </div>
            </div>
            <p className="text-gray-800 dark:text-white font-medium">{dietPlan.breakfast?.dish}</p>
            {dietPlan.breakfast?.portion && (
              <p className="text-sm text-gray-500 mt-1">Portion: {dietPlan.breakfast.portion}</p>
            )}
            {dietPlan.breakfast?.note && (
              <p className="text-xs text-gray-400 mt-1">
                <Info size={12} className="inline mr-1" /> {dietPlan.breakfast.note}
              </p>
            )}
            {dietPlan.breakfast?.alternatives && (
              <details className="mt-2">
                <summary className="text-xs text-blue-600 cursor-pointer">Alternatives</summary>
                <ul className="mt-1 text-xs text-gray-500 list-disc list-inside">
                  {dietPlan.breakfast.alternatives.map((alt: string, i: number) => (
                    <li key={i}>{alt}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          {/* Lunch */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-green-600 dark:text-green-400 text-lg">Lunch</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Flame size={14} />
                <span className={getCalorieColor(dietPlan.lunch?.calories)}>
                  {dietPlan.lunch?.calories || '500-600 kcal'}
                </span>
              </div>
            </div>
            <p className="text-gray-800 dark:text-white font-medium">{dietPlan.lunch?.dish}</p>
            {dietPlan.lunch?.portion && (
              <p className="text-sm text-gray-500 mt-1">Portion: {dietPlan.lunch.portion}</p>
            )}
            {dietPlan.lunch?.note && (
              <p className="text-xs text-gray-400 mt-1">
                <Info size={12} className="inline mr-1" /> {dietPlan.lunch.note}
              </p>
            )}
            {dietPlan.lunch?.alternatives && (
              <details className="mt-2">
                <summary className="text-xs text-blue-600 cursor-pointer">Alternatives</summary>
                <ul className="mt-1 text-xs text-gray-500 list-disc list-inside">
                  {dietPlan.lunch.alternatives.map((alt: string, i: number) => (
                    <li key={i}>{alt}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          {/* Dinner */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-blue-600 dark:text-blue-400 text-lg">Dinner</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Flame size={14} />
                <span className={getCalorieColor(dietPlan.dinner?.calories)}>
                  {dietPlan.dinner?.calories || '400-500 kcal'}
                </span>
              </div>
            </div>
            <p className="text-gray-800 dark:text-white font-medium">{dietPlan.dinner?.dish}</p>
            {dietPlan.dinner?.portion && (
              <p className="text-sm text-gray-500 mt-1">Portion: {dietPlan.dinner.portion}</p>
            )}
            {dietPlan.dinner?.note && (
              <p className="text-xs text-gray-400 mt-1">
                <Info size={12} className="inline mr-1" /> {dietPlan.dinner.note}
              </p>
            )}
            {dietPlan.dinner?.alternatives && (
              <details className="mt-2">
                <summary className="text-xs text-blue-600 cursor-pointer">Alternatives</summary>
                <ul className="mt-1 text-xs text-gray-500 list-disc list-inside">
                  {dietPlan.dinner.alternatives.map((alt: string, i: number) => (
                    <li key={i}>{alt}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          {/* Snacks */}
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-purple-600 dark:text-purple-400 text-lg">Snacks</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Flame size={14} />
                <span className={getCalorieColor(dietPlan.snacks?.calories)}>
                  {dietPlan.snacks?.calories || '150-200 kcal'}
                </span>
              </div>
            </div>
            <p className="text-gray-800 dark:text-white font-medium">{dietPlan.snacks?.dish}</p>
            {dietPlan.snacks?.portion && (
              <p className="text-sm text-gray-500 mt-1">Portion: {dietPlan.snacks.portion}</p>
            )}
            {dietPlan.snacks?.note && (
              <p className="text-xs text-gray-400 mt-1">
                <Info size={12} className="inline mr-1" /> {dietPlan.snacks.note}
              </p>
            )}
            {dietPlan.snacks?.alternatives && (
              <details className="mt-2">
                <summary className="text-xs text-blue-600 cursor-pointer">Alternatives</summary>
                <ul className="mt-1 text-xs text-gray-500 list-disc list-inside">
                  {dietPlan.snacks.alternatives.map((alt: string, i: number) => (
                    <li key={i}>{alt}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>
      )}

      {/* Exercise Plan Content */}
      {!loading && activeTab === 'exercise' && exercisePlan && (
        <div className="space-y-4">
          {exercisePlan.exercises?.map((exercise: any, index: number) => (
            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell size={18} className="text-green-600" />
                  <h3 className="font-semibold text-gray-800 dark:text-white text-lg">
                    {exercise.name}
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {exercise.duration}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{exercise.benefits}</p>
                {exercise.steps && (
                  <details className="mt-2">
                    <summary className="text-xs text-blue-600 cursor-pointer">How to do it</summary>
                    <p className="mt-1 text-xs text-gray-500">{exercise.steps}</p>
                  </details>
                )}
                {exercise.note && (
                  <p className="text-xs text-orange-500 mt-1">
                    <Info size={12} className="inline mr-1" /> {exercise.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !dietPlan && !exercisePlan && (
        <div className="text-center py-12">
          <Utensils size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">Select your preferences to get personalized recommendations</p>
        </div>
      )}
    </div>
  );
};