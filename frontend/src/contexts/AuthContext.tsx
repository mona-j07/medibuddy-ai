import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/auth';
import { User } from '../services/auth';
import { supabase } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string, name: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  checkUsername: (username: string) => Promise<boolean>;
  deleteAccount: () => Promise<void>;
  addBMIRecord: (bmiData: any) => Promise<string>;
  addMedicine: (medicine: any) => Promise<any>;
  completeMedicine: (medicineId: string) => Promise<void>;
  addExercise: (exercise: any) => Promise<any>;
  completeExercise: (exerciseId: string) => Promise<void>;
  getBMIHistory: () => Promise<any[]>;
  getUserMedicines: () => Promise<any[]>;
  getUserExercises: () => Promise<any[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Error loading user:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const currentUser = await authService.getUserById(session.user.id);
        setUser(currentUser);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const loggedInUser = await authService.login({ username, password });
      setUser(loggedInUser);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (username: string, password: string, name: string, email?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      if (!name.trim()) {
        throw new Error('Name is required');
      }
      
      const newUser = await authService.signup({ 
        username: username.toLowerCase(), 
        password, 
        name, 
        email 
      });
      setUser(newUser);
    } catch (err: any) {
      setError(err.message || 'Signup failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Logout failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      setLoading(true);
      if (!user) throw new Error('No user logged in');
      const updatedUser = await authService.updateProfile(user.id, updates);
      setUser(updatedUser);
    } catch (err: any) {
      setError(err.message || 'Profile update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  const checkUsername = async (username: string): Promise<boolean> => {
    return await authService.checkUsername(username.toLowerCase());
  };

  const deleteAccount = async () => {
    try {
      setLoading(true);
      if (!user) throw new Error('No user logged in');
      await authService.deleteAccount(user.id);
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Delete account failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addBMIRecord = async (bmiData: any) => {
    if (!user) throw new Error('No user logged in');
    return await authService.addBMIRecord(user.id, bmiData);
  };

  const addMedicine = async (medicine: any) => {
    if (!user) throw new Error('No user logged in');
    return await authService.addMedicine(user.id, medicine);
  };

  const completeMedicine = async (medicineId: string) => {
    await authService.completeMedicine(medicineId);
  };

  const addExercise = async (exercise: any) => {
    if (!user) throw new Error('No user logged in');
    // You'll need to implement addExercise in authService
    const { data, error } = await supabase
      .from('exercises')
      .insert({
        user_id: user.id,
        exercise_name: exercise.name,
        duration: exercise.duration,
        time: exercise.time,
        difficulty: exercise.difficulty || 'medium'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  const completeExercise = async (exerciseId: string) => {
    await authService.completeExercise(exerciseId);
  };

  const getBMIHistory = async () => {
    if (!user) return [];
    return await authService.getBMIHistory(user.id);
  };

  const getUserMedicines = async () => {
    if (!user) return [];
    return await authService.getUserMedicines(user.id);
  };

  const getUserExercises = async () => {
    if (!user) return [];
    return await authService.getUserExercises(user.id);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      signup,
      logout,
      updateProfile,
      refreshUser,
      checkUsername,
      deleteAccount,
      addBMIRecord,
      addMedicine,
      completeMedicine,
      addExercise,
      completeExercise,
      getBMIHistory,
      getUserMedicines,
      getUserExercises
    }}>
      {children}
    </AuthContext.Provider>
  );
};