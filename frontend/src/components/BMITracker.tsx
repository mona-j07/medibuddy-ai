import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useVoice } from '../contexts/VoiceContext';
import toast from 'react-hot-toast';

interface BMICalculation {
  bmi: number;
  category: string;
  age_group: string;
}

export const BMITracker: React.FC = () => {
  const { user } = useAuth();
  const { speak } = useVoice();
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [result, setResult] = useState<BMICalculation | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateBMI = async () => {
    if (!weight || !height || !age) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bmi/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          weight: parseFloat(weight),
          height: parseFloat(height),
          age: parseInt(age),
          gender
        })
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data);
        speak(`Your BMI is ${data.bmi}. You are in the ${data.category} category.`);
        toast.success('BMI calculated successfully!');
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Error calculating BMI');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'underweight': return 'text-yellow-600 bg-yellow-100';
      case 'normal': return 'text-green-600 bg-green-100';
      case 'overweight': return 'text-orange-600 bg-orange-100';
      case 'obese': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">BMI Tracker</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Weight (kg)</label>
          <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            placeholder="Enter weight" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Height (cm)</label>
          <input type="number" value={height} onChange={(e) => setHeight(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            placeholder="Enter height" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Age (years)</label>
          <input type="number" value={age} onChange={(e) => setAge(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            placeholder="Enter age" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>
      
      <button onClick={calculateBMI} disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">
        {loading ? 'Calculating...' : 'Calculate BMI'}
      </button>
      
      {result && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{result.bmi}</div>
            <div className={`inline-block px-4 py-2 rounded-full font-semibold ${getCategoryColor(result.category)}`}>
              {result.category.toUpperCase()}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Age Group: {result.age_group.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};