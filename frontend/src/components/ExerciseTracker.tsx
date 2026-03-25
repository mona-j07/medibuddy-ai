import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Dumbbell, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface Exercise {
  id: string;
  exercise_name: string;
  duration: string;
  time: string;
  status: string;
}

export const ExerciseTracker: React.FC = () => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', duration: '', time: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExercises();
  }, [user]);

  const fetchExercises = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/exercise/list/${user?.id}`);
      const data = await response.json();
      setExercises(data);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const addExercise = async () => {
    if (!newExercise.name || !newExercise.duration || !newExercise.time) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/exercise/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id, exercise_name: newExercise.name, duration: newExercise.duration, time: newExercise.time })
      });

      if (response.ok) {
        toast.success('Exercise added successfully');
        setNewExercise({ name: '', duration: '', time: '' });
        setShowForm(false);
        fetchExercises();
      }
    } catch (error) {
      toast.error('Error adding exercise');
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async (id: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/exercise/complete/${id}`, {
        method: 'PUT'
      });
      if (response.ok) {
        toast.success('Exercise marked as completed');
        fetchExercises();
      }
    } catch (error) {
      toast.error('Error updating exercise');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Dumbbell className="text-green-600" /> Exercise Tracker
        </h2>
        <button onClick={() => setShowForm(!showForm)} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          <Plus size={18} />
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input type="text" placeholder="Exercise name" value={newExercise.name}
              onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
              className="px-3 py-2 border rounded-lg dark:bg-gray-600 dark:text-white" />
            <input type="text" placeholder="Duration (e.g., 30 min)" value={newExercise.duration}
              onChange={(e) => setNewExercise({ ...newExercise, duration: e.target.value })}
              className="px-3 py-2 border rounded-lg dark:bg-gray-600 dark:text-white" />
            <input type="time" value={newExercise.time}
              onChange={(e) => setNewExercise({ ...newExercise, time: e.target.value })}
              className="px-3 py-2 border rounded-lg dark:bg-gray-600 dark:text-white" />
          </div>
          <button onClick={addExercise} disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
            {loading ? 'Adding...' : 'Add Exercise'}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {exercises.map(ex => (
          <div key={ex.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <div className="font-semibold dark:text-white">{ex.exercise_name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{ex.duration} at {ex.time}</div>
            </div>
            {ex.status === 'pending' ? (
              <button onClick={() => markComplete(ex.id)} className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                Complete
              </button>
            ) : (
              <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">Completed</span>
            )}
          </div>
        ))}
        {exercises.length === 0 && (
          <p className="text-center text-gray-500 py-4">No exercises added yet</p>
        )}
      </div>
    </div>
  );
};