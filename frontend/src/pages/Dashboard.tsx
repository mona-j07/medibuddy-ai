import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useVoice } from '../contexts/VoiceContext';
import { useReminder } from '../hooks/useReminder';
import { VoiceAssistant } from '../components/VoiceAssistant';
import { DietRecommendation } from '../components/DietRecommendation';
import { 
  Activity, 
  LogOut, 
  Moon, 
  Sun, 
  Download, 
  Pill, 
  Dumbbell, 
  Utensils, 
  Mic, 
  Volume2, 
  UserCircle,
  Clock,
  TrendingUp,
  Heart,
  Target,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  Bell,
  BellOff,
  Calendar,
  Weight,
  Ruler
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const { speak, voiceEnabled, toggleVoice, isListening, startListening } = useVoice();
  const { activeReminder, reminders, addReminder, markComplete, stopAlarm } = useReminder();
  
  // State for BMI Calculator
  const [weight, setWeight] = useState(user?.weight?.toString() || '');
  const [height, setHeight] = useState(user?.height?.toString() || '');
  const [age, setAge] = useState(user?.age?.toString() || '');
  const [gender, setGender] = useState(user?.gender || 'male');
  const [bmiResult, setBmiResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [bmiHistory, setBmiHistory] = useState<any[]>([]);
  
  // State for UI
  const [darkMode, setDarkMode] = useState(false);
  const [showMedicineForm, setShowMedicineForm] = useState(false);
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // State for Data
  const [medicines, setMedicines] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [exercisePlan, setExercisePlan] = useState<any>(null);
  
  // Form states
  const [newMedicine, setNewMedicine] = useState({ name: '', dosage: '', time: '' });
  const [newExercise, setNewExercise] = useState({ name: '', duration: '', time: '' });
  const [userId] = useState(user?.id || 'demo-user');

  // Health stats
  const [healthStats, setHealthStats] = useState({
    totalMedicines: 0,
    completedMedicines: 0,
    totalExercises: 0,
    completedExercises: 0,
    weeklyProgress: 0
  });

  // Theme handling
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newMode);
  };

  // Voice command handling
  useEffect(() => {
    const handleVoiceCommand = (event: CustomEvent) => {
      const command = event.detail.command.toLowerCase();
      console.log('Voice command:', command);
      
      if (command.includes('calculate bmi') || command.includes('bmi calculator')) {
        speak('Opening BMI calculator');
        document.getElementById('bmi-section')?.scrollIntoView({ behavior: 'smooth' });
        setActiveTab('bmi');
      } 
      else if (command.includes('add medicine') || command.includes('add medication')) {
        speak('Opening medicine tracker');
        setShowMedicineForm(true);
        document.getElementById('medicine-section')?.scrollIntoView({ behavior: 'smooth' });
        setActiveTab('medicines');
      }
      else if (command.includes('add exercise') || command.includes('add workout')) {
        speak('Opening exercise tracker');
        setShowExerciseForm(true);
        document.getElementById('exercise-section')?.scrollIntoView({ behavior: 'smooth' });
        setActiveTab('exercises');
      }
      else if (command.includes('diet plan') || command.includes('meal plan')) {
        speak('Showing your diet plan');
        setActiveTab('diet');
      }
      else if (command.includes('generate report') || command.includes('health report')) {
        speak('Generating your health report');
        generateReport();
      }
      else if (command.includes('stop alarm') || command.includes('stop reminder')) {
        if (activeReminder) {
          speak('Stopping alarm');
          markComplete(activeReminder.id, activeReminder.type);
        } else {
          speak('No active alarm to stop');
        }
      }
      else if (command.includes('my profile') || command.includes('profile')) {
        speak('Opening your profile');
        window.location.href = '/profile';
      }
      else if (command.includes('dark mode')) {
        if (!darkMode) toggleDarkMode();
        speak('Dark mode enabled');
      }
      else if (command.includes('light mode')) {
        if (darkMode) toggleDarkMode();
        speak('Light mode enabled');
      }
      else {
        speak("I can help with BMI, medicine, exercise, diet plans, and reports. What would you like?");
      }
    };

    window.addEventListener('voice-command', handleVoiceCommand as EventListener);
    return () => window.removeEventListener('voice-command', handleVoiceCommand as EventListener);
  }, [activeReminder, darkMode, speak]);

  // Fetch data on load
  useEffect(() => {
    fetchMedicines();
    fetchExercises();
    fetchBMIHistory();
    fetchRecommendations();
    
    // Welcome message
    setTimeout(() => {
      const hour = new Date().getHours();
      let greeting = 'Good morning';
      if (hour >= 12) greeting = 'Good afternoon';
      if (hour >= 18) greeting = 'Good evening';
      
      speak(`${greeting} ${user?.name || 'User'}! Welcome to MediBuddy.`);
    }, 2000);
  }, []);

  // Update health stats when data changes
  useEffect(() => {
    const completedMeds = medicines.filter(m => m.status === 'completed').length;
    const totalMeds = medicines.length;
    const completedEx = exercises.filter(e => e.status === 'completed').length;
    const totalEx = exercises.length;
    
    setHealthStats({
      totalMedicines: totalMeds,
      completedMedicines: completedMeds,
      totalExercises: totalEx,
      completedExercises: completedEx,
      weeklyProgress: ((completedMeds + completedEx) / (totalMeds + totalEx) * 100) || 0
    });
  }, [medicines, exercises]);

  const calculateBMI = async () => {
    if (!weight || !height || !age) {
      speak('Please fill all fields for BMI calculation');
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/bmi/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          weight: parseFloat(weight),
          height: parseFloat(height),
          age: parseInt(age),
          gender
        })
      });

      const data = await response.json();
      if (response.ok) {
        setBmiResult(data);
        
        // Update user profile with height and weight
        if (user) {
          await updateProfile({ height: parseFloat(height), weight: parseFloat(weight), age: parseInt(age), gender });
        }
        
        const advice = getBMICategoryAdvice(data.category);
        const message = `Your BMI is ${data.bmi}. You are in the ${data.category} category. ${advice}`;
        speak(message);
        toast.success(`BMI: ${data.bmi} - ${data.category}`);
        fetchBMIHistory();
        fetchRecommendations();
      } else {
        speak('Error calculating BMI');
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      speak('Error connecting to server');
      toast.error('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const getBMICategoryAdvice = (category: string) => {
    switch (category) {
      case 'underweight':
        return 'Focus on calorie-dense, nutrient-rich foods. Include healthy fats and proteins.';
      case 'normal':
        return 'Great job! Maintain your healthy lifestyle with balanced diet and regular exercise.';
      case 'overweight':
        return 'Consider reducing calorie intake and increasing physical activity. Aim for 30 minutes of exercise daily.';
      case 'obese':
        return 'Please consult a healthcare provider. Start with gentle exercises and portion control.';
      default:
        return 'Keep tracking your health regularly.';
    }
  };

  const addMedicine = async () => {
    if (!newMedicine.name || !newMedicine.dosage || !newMedicine.time) {
      speak('Please fill all medicine fields');
      toast.error('Please fill all fields');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/medicine/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          ...newMedicine
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMedicines([...medicines, data]);
        
        addReminder({
          id: data.id.toString(),
          type: 'medicine',
          name: data.name,
          details: data.dosage,
          time: data.time
        });
        
        setNewMedicine({ name: '', dosage: '', time: '' });
        setShowMedicineForm(false);
        speak(`${data.name} added for ${data.time}`);
        toast.success('Medicine added successfully!');
      }
    } catch (error) {
      speak('Error adding medicine');
      toast.error('Error adding medicine');
    }
  };

  const addExercise = async () => {
    if (!newExercise.name || !newExercise.duration || !newExercise.time) {
      speak('Please fill all exercise fields');
      toast.error('Please fill all fields');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/exercise/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          exercise_name: newExercise.name,
          duration: newExercise.duration,
          time: newExercise.time
        })
      });

      if (response.ok) {
        const data = await response.json();
        setExercises([...exercises, data]);
        
        addReminder({
          id: data.id.toString(),
          type: 'exercise',
          name: data.exercise_name,
          details: `${data.duration} minutes`,
          time: data.time
        });
        
        setNewExercise({ name: '', duration: '', time: '' });
        setShowExerciseForm(false);
        speak(`${data.exercise_name} exercise added for ${data.time}`);
        toast.success('Exercise added successfully!');
      }
    } catch (error) {
      speak('Error adding exercise');
      toast.error('Error adding exercise');
    }
  };

  const fetchMedicines = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/medicine/list/${userId}`);
      const data = await response.json();
      setMedicines(data);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const fetchExercises = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/exercise/list/${userId}`);
      const data = await response.json();
      setExercises(data);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const fetchBMIHistory = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/bmi/history/${userId}`);
      const data = await response.json();
      setBmiHistory(data);
    } catch (error) {
      console.error('Error fetching BMI history:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/recommendations/${userId}`);
      const data = await response.json();
      setDietPlan(data.diet_plan);
      setExercisePlan(data.exercise_plan);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const generateReport = async () => {
    try {
      speak('Generating your health report');
      const response = await fetch(`http://localhost:5000/api/report/generate/${userId}`);
      const data = await response.json();
      const reportText = JSON.stringify(data, null, 2);
      const blob = new Blob([reportText], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `health_report_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      speak('Health report generated and downloaded');
      toast.success('Report downloaded!');
    } catch (error) {
      console.error('Error:', error);
      speak('Error generating report');
      toast.error('Error generating report');
    }
  };

  const medicineAdherence = medicines.length > 0 
    ? (medicines.filter(m => m.status === 'completed').length / medicines.length) * 100 
    : 0;
  
  const exerciseCompletion = exercises.length > 0 
    ? (exercises.filter(e => e.status === 'completed').length / exercises.length) * 100 
    : 0;

  const pendingMedicines = medicines.filter(m => m.status === 'pending').length;
  const pendingExercises = exercises.filter(e => e.status === 'pending').length;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'underweight': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'normal': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'overweight': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300';
      case 'obese': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">MediBuddy AI+ Pro Max</h1>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                {/* Voice Status */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                  {isListening ? (
                    <>
                      <Mic size={14} className="text-red-500 animate-pulse" />
                      <span className="text-xs text-gray-600 dark:text-gray-300">Listening...</span>
                    </>
                  ) : voiceEnabled ? (
                    <>
                      <Volume2 size={14} className="text-green-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-300">Voice ON</span>
                    </>
                  ) : (
                    <>
                      <BellOff size={14} className="text-gray-400" />
                      <span className="text-xs text-gray-400">Voice OFF</span>
                    </>
                  )}
                </div>
                
                <button onClick={toggleVoice} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 transition">
                  {voiceEnabled ? <Volume2 size={18} /> : <Mic size={18} />}
                </button>
                
                <button onClick={toggleDarkMode} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 transition">
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                
                <Link to="/profile" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                  <UserCircle size={18} />
                  {user?.name || 'Profile'}
                </Link>
                
                <button onClick={generateReport} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                  <Download size={16} /> Report
                </button>
                
                <button onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-2 mt-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
              {['dashboard', 'bmi', 'medicines', 'exercises', 'diet'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome Card */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">
                  Welcome back, {user?.name || 'User'}! 👋
                </h2>
                <p className="text-blue-100">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <div className="mt-4 flex gap-4">
                  <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                    <div className="text-2xl font-bold">{pendingMedicines}</div>
                    <div className="text-sm">Pending Medicines</div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                    <div className="text-2xl font-bold">{pendingExercises}</div>
                    <div className="text-sm">Pending Exercises</div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Pill className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-2xl font-bold text-blue-600">{medicineAdherence.toFixed(0)}%</span>
                  </div>
                  <h3 className="text-gray-600 dark:text-gray-400 text-sm">Medicine Adherence</h3>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${medicineAdherence}%` }}></div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Dumbbell className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-2xl font-bold text-green-600">{exerciseCompletion.toFixed(0)}%</span>
                  </div>
                  <h3 className="text-gray-600 dark:text-gray-400 text-sm">Exercise Completion</h3>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${exerciseCompletion}%` }}></div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-2xl font-bold text-purple-600">{healthStats.weeklyProgress.toFixed(0)}%</span>
                  </div>
                  <h3 className="text-gray-600 dark:text-gray-400 text-sm">Weekly Progress</h3>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${healthStats.weeklyProgress}%` }}></div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                      <Heart className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-2xl font-bold text-orange-600">{bmiHistory.length}</span>
                  </div>
                  <h3 className="text-gray-600 dark:text-gray-400 text-sm">BMI Records</h3>
                  <div className="text-xs text-gray-500 mt-2">Total health check-ins</div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Clock size={18} /> Recent Medicines
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {medicines.slice(0, 5).map(med => (
                      <div key={med.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <div className="font-semibold dark:text-white">{med.name}</div>
                          <div className="text-sm text-gray-500">{med.dosage} at {med.time}</div>
                        </div>
                        {med.status === 'pending' ? (
                          <span className="text-yellow-600 text-sm">Pending</span>
                        ) : (
                          <CheckCircle size={16} className="text-green-500" />
                        )}
                      </div>
                    ))}
                    {medicines.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No medicines added yet</p>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={18} /> Recent Exercises
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {exercises.slice(0, 5).map(ex => (
                      <div key={ex.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <div className="font-semibold dark:text-white">{ex.exercise_name}</div>
                          <div className="text-sm text-gray-500">{ex.duration} at {ex.time}</div>
                        </div>
                        {ex.status === 'pending' ? (
                          <span className="text-yellow-600 text-sm">Pending</span>
                        ) : (
                          <CheckCircle size={16} className="text-green-500" />
                        )}
                      </div>
                    ))}
                    {exercises.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No exercises added yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Diet and Exercise Recommendations */}
              <DietRecommendation 
                userBMI={bmiResult}
                userAge={user?.age}
                userGender={user?.gender}
              />
            </div>
          )}

          {/* BMI Calculator View */}
          {activeTab === 'bmi' && (
            <div id="bmi-section" className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">BMI Calculator</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Weight size={16} className="inline mr-1" /> Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter weight"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Ruler size={16} className="inline mr-1" /> Height (cm)
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter height"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar size={16} className="inline mr-1" /> Age (years)
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter age"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <button
                onClick={calculateBMI}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? 'Calculating...' : 'Calculate BMI'}
              </button>
              {bmiResult && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{bmiResult.bmi}</div>
                  <div className={`inline-block px-4 py-2 rounded-full font-semibold ${getCategoryColor(bmiResult.category)}`}>
                    {bmiResult.category.toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                    {getBMICategoryAdvice(bmiResult.category)}
                  </div>
                </div>
              )}
              {bmiHistory.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Recent BMI History</h3>
                  <div className="space-y-2">
                    {bmiHistory.slice(0, 5).map((record, idx) => (
                      <div key={idx} className="flex justify-between text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span>{new Date(record.created_at).toLocaleDateString()}</span>
                        <span className="font-semibold">{record.bmi_value}</span>
                        <span className={record.category === 'normal' ? 'text-green-600' : 'text-yellow-600'}>
                          {record.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Medicines View */}
          {activeTab === 'medicines' && (
            <div id="medicine-section" className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Pill className="text-blue-600" /> Medicine Tracker
                </h2>
                <button
                  onClick={() => setShowMedicineForm(!showMedicineForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus size={16} /> Add Medicine
                </button>
              </div>

              {showMedicineForm && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Medicine name"
                      value={newMedicine.name}
                      onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g., 500mg)"
                      value={newMedicine.dosage}
                      onChange={(e) => setNewMedicine({ ...newMedicine, dosage: e.target.value })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                    />
                    <input
                      type="time"
                      value={newMedicine.time}
                      onChange={(e) => setNewMedicine({ ...newMedicine, time: e.target.value })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                    />
                  </div>
                  <button
                    onClick={addMedicine}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Add Medicine
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {medicines.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Pill size={48} className="mx-auto mb-3 opacity-50" />
                    <p>No medicines added yet</p>
                    <p className="text-sm">Click "Add Medicine" to start tracking</p>
                  </div>
                ) : (
                  medicines.map((med) => (
                    <div key={med.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition">
                      <div className="flex-1">
                        <div className="font-semibold dark:text-white text-lg">{med.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{med.dosage}</div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Clock size={12} /> {med.time}
                        </div>
                      </div>
                      {med.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => markComplete(med.id, 'medicine')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                          >
                            <CheckCircle size={16} /> Take
                          </button>
                          <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle size={20} />
                          <span className="text-sm">Taken</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Exercises View */}
          {activeTab === 'exercises' && (
            <div id="exercise-section" className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Dumbbell className="text-green-600" /> Exercise Tracker
                </h2>
                <button
                  onClick={() => setShowExerciseForm(!showExerciseForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Plus size={16} /> Add Exercise
                </button>
              </div>

              {showExerciseForm && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Exercise name"
                      value={newExercise.name}
                      onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Duration (e.g., 30 min)"
                      value={newExercise.duration}
                      onChange={(e) => setNewExercise({ ...newExercise, duration: e.target.value })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                    />
                    <input
                      type="time"
                      value={newExercise.time}
                      onChange={(e) => setNewExercise({ ...newExercise, time: e.target.value })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                    />
                  </div>
                  <button
                    onClick={addExercise}
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    Add Exercise
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {exercises.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Dumbbell size={48} className="mx-auto mb-3 opacity-50" />
                    <p>No exercises added yet</p>
                    <p className="text-sm">Click "Add Exercise" to start tracking</p>
                  </div>
                ) : (
                  exercises.map((ex) => (
                    <div key={ex.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition">
                      <div className="flex-1">
                        <div className="font-semibold dark:text-white text-lg">{ex.exercise_name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{ex.duration}</div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Clock size={12} /> {ex.time}
                        </div>
                      </div>
                      {ex.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => markComplete(ex.id, 'exercise')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                          >
                            <CheckCircle size={16} /> Complete
                          </button>
                          <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle size={20} />
                          <span className="text-sm">Completed</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Diet View */}
          {activeTab === 'diet' && (
            <DietRecommendation 
              userBMI={bmiResult}
              userAge={user?.age}
              userGender={user?.gender}
            />
          )}
        </main>
      </div>

      {/* Voice Assistant */}
      <VoiceAssistant />

      {/* Reminder Popup */}
      {activeReminder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">⏰</div>
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">REMINDER!</h2>
              <div className="text-lg font-semibold dark:text-white">{activeReminder.name}</div>
              <div className="text-gray-500 dark:text-gray-400 mt-2">{activeReminder.details}</div>
              <div className="text-sm text-gray-400 mt-1">at {activeReminder.time}</div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => markComplete(activeReminder.id, activeReminder.type)}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} /> Mark Complete
                </button>
                <button
                  onClick={stopAlarm}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2"
                >
                  <BellOff size={18} /> Snooze
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;