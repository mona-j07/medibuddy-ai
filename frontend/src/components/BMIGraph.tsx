import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BMIHistory {
  created_at: string;
  bmi_value: number;
  category: string;
}

export const BMIGraph: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<BMIHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBMIHistory();
  }, [user]);

  const fetchBMIHistory = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bmi/history/${user?.id}`);
      const data = await response.json();
      setHistory(data.reverse());
    } catch (error) {
      console.error('Error fetching BMI history:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = history.map(record => ({
    date: new Date(record.created_at).toLocaleDateString(),
    bmi: record.bmi_value
  }));

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">BMI Progress</h2>
        <p className="text-center text-gray-500 py-8">No BMI records yet. Calculate your first BMI!</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">BMI Progress</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="bmi" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};