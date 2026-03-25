import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Pill, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  time: string;
  status: string;
}

export const MedicineTracker: React.FC = () => {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newMedicine, setNewMedicine] = useState({ name: '', dosage: '', time: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMedicines();
  }, [user]);

  const fetchMedicines = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/medicine/list/${user?.id}`);
      const data = await response.json();
      setMedicines(data);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const addMedicine = async () => {
    if (!newMedicine.name || !newMedicine.dosage || !newMedicine.time) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/medicine/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id, ...newMedicine })
      });

      if (response.ok) {
        toast.success('Medicine added successfully');
        setNewMedicine({ name: '', dosage: '', time: '' });
        setShowForm(false);
        fetchMedicines();
      }
    } catch (error) {
      toast.error('Error adding medicine');
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async (id: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/medicine/complete/${id}`, {
        method: 'PUT'
      });
      if (response.ok) {
        toast.success('Medicine marked as taken');
        fetchMedicines();
      }
    } catch (error) {
      toast.error('Error updating medicine');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Pill className="text-blue-600" /> Medicine Tracker
        </h2>
        <button onClick={() => setShowForm(!showForm)} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={18} />
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input type="text" placeholder="Medicine name" value={newMedicine.name}
              onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
              className="px-3 py-2 border rounded-lg dark:bg-gray-600 dark:text-white" />
            <input type="text" placeholder="Dosage (e.g., 500mg)" value={newMedicine.dosage}
              onChange={(e) => setNewMedicine({ ...newMedicine, dosage: e.target.value })}
              className="px-3 py-2 border rounded-lg dark:bg-gray-600 dark:text-white" />
            <input type="time" value={newMedicine.time}
              onChange={(e) => setNewMedicine({ ...newMedicine, time: e.target.value })}
              className="px-3 py-2 border rounded-lg dark:bg-gray-600 dark:text-white" />
          </div>
          <button onClick={addMedicine} disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
            {loading ? 'Adding...' : 'Add Medicine'}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {medicines.map(med => (
          <div key={med.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <div className="font-semibold dark:text-white">{med.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{med.dosage} at {med.time}</div>
            </div>
            {med.status === 'pending' ? (
              <button onClick={() => markComplete(med.id)} className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                Take
              </button>
            ) : (
              <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">Taken</span>
            )}
          </div>
        ))}
        {medicines.length === 0 && (
          <p className="text-center text-gray-500 py-4">No medicines added yet</p>
        )}
      </div>
    </div>
  );
};