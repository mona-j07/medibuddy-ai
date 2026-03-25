import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Activity, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export const HealthAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [bmiHistory, setBmiHistory] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [bmiRes, medRes, exRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/bmi/history/${user?.id}`),
        fetch(`${import.meta.env.VITE_API_URL}/api/medicine/list/${user?.id}`),
        fetch(`${import.meta.env.VITE_API_URL}/api/exercise/list/${user?.id}`)
      ]);
      
      setBmiHistory(await bmiRes.json());
      setMedicines(await medRes.json());
      setExercises(await exRes.json());
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const medicineAdherence = medicines.length > 0 
    ? (medicines.filter(m => m.status === 'completed').length / medicines.length) * 100 
    : 0;
  
  const exerciseCompletion = exercises.length > 0 
    ? (exercises.filter(e => e.status === 'completed').length / exercises.length) * 100 
    : 0;

  const pieData = [
    { name: 'Underweight', value: bmiHistory.filter(b => b.category === 'underweight').length, color: '#F59E0B' },
    { name: 'Normal', value: bmiHistory.filter(b => b.category === 'normal').length, color: '#10B981' },
    { name: 'Overweight', value: bmiHistory.filter(b => b.category === 'overweight').length, color: '#F97316' },
    { name: 'Obese', value: bmiHistory.filter(b => b.category === 'obese').length, color: '#EF4444' }
  ].filter(p => p.value > 0);

  const latestBMI = bmiHistory[0];
  const previousBMI = bmiHistory[1];
  const improvement = previousBMI && latestBMI 
    ? ((previousBMI.bmi_value - latestBMI.bmi_value) / previousBMI.bmi_value * 100).toFixed(1)
    : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <Activity /> Health Analytics
      </h2>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 dark:bg-gray-700 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{medicineAdherence.toFixed(0)}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Medicine Adherence</div>
          </div>
          <div className="p-3 bg-green-50 dark:bg-gray-700 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{exerciseCompletion.toFixed(0)}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Exercise Completion</div>
          </div>
        </div>

        {improvement && (
          <div className={`p-3 rounded-lg text-center ${parseFloat(improvement) >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <TrendingUp size={20} className={`inline ${parseFloat(improvement) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            <span className={`ml-2 font-semibold ${parseFloat(improvement) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {improvement}% {parseFloat(improvement) >= 0 ? 'improvement' : 'decline'}
            </span>
            <div className="text-xs text-gray-500">vs previous BMI</div>
          </div>
        )}

        {pieData.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">BMI Distribution</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={70} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Records: {bmiHistory.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {medicines.filter(m => m.status === 'completed').length} / {medicines.length} medicines taken
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};