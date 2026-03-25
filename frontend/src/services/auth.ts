import { supabase } from './supabase';

export interface User {
  id: string;
  username: string;
  email?: string;
  name: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  region?: string;
  dietary_preference?: string;
  medical_conditions?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupData {
  username: string;
  password: string;
  name: string;
  email?: string;
}

class AuthService {
  // DEMO MODE - No email, no rate limits, works instantly
  private DEMO_MODE = true;

  // Check if username exists
  async checkUsername(username: string): Promise<boolean> {
    if (this.DEMO_MODE) {
      // In demo mode, check localStorage for existing users
      const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
      return !users.some((u: any) => u.username === username.toLowerCase());
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', username.toLowerCase())
        .maybeSingle();

      if (error) {
        console.error('Error checking username:', error);
        return false;
      }

      return !data;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  }

  // Get user by username
  async getUserByUsername(username: string): Promise<User | null> {
    if (this.DEMO_MODE) {
      const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
      const user = users.find((u: any) => u.username === username.toLowerCase());
      return user || null;
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.toLowerCase())
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return data as User;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    if (this.DEMO_MODE) {
      const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
      const user = users.find((u: any) => u.id === userId);
      return user || null;
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return data as User;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  // Create user profile
  async createUserProfile(userId: string, username: string, email: string, name: string): Promise<User | null> {
    if (this.DEMO_MODE) {
      const newUser: User = {
        id: userId,
        username: username.toLowerCase(),
        email: email,
        name: name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
      users.push(newUser);
      localStorage.setItem('demo_users', JSON.stringify(users));
      localStorage.setItem('demo_current_user', JSON.stringify(newUser));
      
      return newUser;
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          username: username.toLowerCase(),
          email: email,
          name: name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }

      return data as User;
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      return null;
    }
  }

  // Login with username and password
  async login(credentials: LoginCredentials): Promise<User> {
    if (this.DEMO_MODE) {
      console.log('DEMO MODE: Login attempt for', credentials.username);
      
      // Check if user exists in demo storage
      const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
      const user = users.find((u: any) => u.username === credentials.username.toLowerCase());
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Check password (in demo mode, any password works)
      if (!credentials.password) {
        throw new Error('Invalid password');
      }
      
      localStorage.setItem('demo_current_user', JSON.stringify(user));
      return user;
    }
    
    try {
      const user = await this.getUserByUsername(credentials.username);
      
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.email) {
        throw new Error('No email associated with this account');
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: credentials.password
      });

      if (authError) {
        throw new Error('Invalid password');
      }

      return user;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  // Sign up with username and password
  async signup(data: SignupData): Promise<User> {
    if (this.DEMO_MODE) {
      console.log('DEMO MODE: Signup for', data.username);
      
      // Validate username
      if (data.username.length < 3) {
        throw new Error('Username must be at least 3 characters');
      }

      // Check if username already exists
      const isAvailable = await this.checkUsername(data.username);
      if (!isAvailable) {
        throw new Error('Username already taken');
      }

      // Create demo user
      const userId = `demo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const newUser: User = {
        id: userId,
        username: data.username.toLowerCase(),
        name: data.name,
        email: data.email || `${data.username}@demo.com`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
      users.push(newUser);
      localStorage.setItem('demo_users', JSON.stringify(users));
      localStorage.setItem('demo_current_user', JSON.stringify(newUser));
      
      console.log('Demo user created:', newUser);
      return newUser;
    }
    
    // Original Supabase signup code (won't run in demo mode)
    try {
      console.log('Starting signup for username:', data.username);
      
      if (data.username.length < 3) {
        throw new Error('Username must be at least 3 characters');
      }

      const isAvailable = await this.checkUsername(data.username);
      if (!isAvailable) {
        throw new Error('Username already taken');
      }

      const fixedEmail = `medibuddy_users@temp.com`;
      const password = data.password;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: fixedEmail,
        password: password,
        options: {
          data: {
            username: data.username.toLowerCase(),
            name: data.name,
            actual_email: data.email || null
          }
        }
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        if (authError.message.includes('already registered')) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: fixedEmail,
            password: password
          });
          
          if (signInError) {
            throw new Error('Login failed. Please use a different password.');
          }
          
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            const userProfile = await this.createUserProfile(
              currentUser.id,
              data.username,
              fixedEmail,
              data.name
            );
            if (userProfile) return userProfile;
          }
        }
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      let userProfile = await this.getUserById(authData.user.id);
      
      if (!userProfile) {
        userProfile = await this.createUserProfile(
          authData.user.id,
          data.username,
          fixedEmail,
          data.name
        );
      }

      if (!userProfile) {
        throw new Error('Failed to create user profile');
      }
      
      await supabase.auth.signInWithPassword({
        email: fixedEmail,
        password: data.password
      });

      return userProfile;
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Signup failed');
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    if (this.DEMO_MODE) {
      const currentUser = localStorage.getItem('demo_current_user');
      if (currentUser) {
        return JSON.parse(currentUser);
      }
      return null;
    }
    
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        return null;
      }
      
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (userData) {
        return userData as User;
      }
      
      const username = authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'user';
      const name = authUser.user_metadata?.name || username;
      
      const newProfile = await this.createUserProfile(
        authUser.id,
        username,
        authUser.email || `${username}@temp.medibuddy.com`,
        name
      );
      
      return newProfile;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Update user profile
  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    if (this.DEMO_MODE) {
      const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
      const userIndex = users.findIndex((u: any) => u.id === userId);
      
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updates, updated_at: new Date().toISOString() };
        localStorage.setItem('demo_users', JSON.stringify(users));
        
        const currentUser = localStorage.getItem('demo_current_user');
        if (currentUser) {
          const current = JSON.parse(currentUser);
          if (current.id === userId) {
            localStorage.setItem('demo_current_user', JSON.stringify(users[userIndex]));
          }
        }
        
        return users[userIndex];
      }
      throw new Error('User not found');
    }
    
    try {
      delete updates.username;
      delete updates.id;
      delete updates.created_at;

      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as User;
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  }

  // Logout
  async logout(): Promise<void> {
    if (this.DEMO_MODE) {
      localStorage.removeItem('demo_current_user');
      return;
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  // Delete user account
  async deleteAccount(userId: string): Promise<boolean> {
    if (this.DEMO_MODE) {
      const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
      const filteredUsers = users.filter((u: any) => u.id !== userId);
      localStorage.setItem('demo_users', JSON.stringify(filteredUsers));
      localStorage.removeItem('demo_current_user');
      return true;
    }
    
    try {
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (userError) {
        console.error('Error deleting user profile:', userError);
      }

      await this.logout();
      
      return true;
    } catch (error) {
      console.error('Delete account error:', error);
      return false;
    }
  }

  // Add BMI record
  async addBMIRecord(userId: string, bmiData: any): Promise<string> {
    if (this.DEMO_MODE) {
      const id = `demo_${Date.now()}`;
      const records = JSON.parse(localStorage.getItem('demo_bmi_records') || '[]');
      records.push({ id, user_id: userId, ...bmiData, created_at: new Date().toISOString() });
      localStorage.setItem('demo_bmi_records', JSON.stringify(records));
      return id;
    }
    
    try {
      const { data, error } = await supabase
        .from('bmi_records')
        .insert({
          user_id: userId,
          ...bmiData
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error: any) {
      console.error('Add BMI record error:', error);
      throw new Error(error.message || 'Failed to add BMI record');
    }
  }

  // Add medicine
  async addMedicine(userId: string, medicine: any): Promise<any> {
    if (this.DEMO_MODE) {
      const newMedicine = {
        id: `demo_${Date.now()}`,
        user_id: userId,
        name: medicine.name,
        dosage: medicine.dosage,
        reminder_time: medicine.time,
        frequency: medicine.frequency || 'daily',
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      const medicines = JSON.parse(localStorage.getItem('demo_medicines') || '[]');
      medicines.push(newMedicine);
      localStorage.setItem('demo_medicines', JSON.stringify(medicines));
      return newMedicine;
    }
    
    try {
      const { data, error } = await supabase
        .from('medicines')
        .insert({
          user_id: userId,
          name: medicine.name,
          dosage: medicine.dosage,
          reminder_time: medicine.time,
          frequency: medicine.frequency || 'daily'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Add medicine error:', error);
      throw new Error(error.message || 'Failed to add medicine');
    }
  }

  // Add exercise
  async addExercise(userId: string, exercise: any): Promise<any> {
    if (this.DEMO_MODE) {
      const newExercise = {
        id: `demo_${Date.now()}`,
        user_id: userId,
        exercise_name: exercise.name,
        duration: exercise.duration,
        exercise_time: exercise.time,
        difficulty: exercise.difficulty || 'medium',
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      const exercises = JSON.parse(localStorage.getItem('demo_exercises') || '[]');
      exercises.push(newExercise);
      localStorage.setItem('demo_exercises', JSON.stringify(exercises));
      return newExercise;
    }
    
    try {
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          user_id: userId,
          exercise_name: exercise.name,
          duration: exercise.duration,
          exercise_time: exercise.time,
          difficulty: exercise.difficulty || 'medium'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Add exercise error:', error);
      throw new Error(error.message || 'Failed to add exercise');
    }
  }

  // Complete medicine
  async completeMedicine(medicineId: string): Promise<void> {
    if (this.DEMO_MODE) {
      const medicines = JSON.parse(localStorage.getItem('demo_medicines') || '[]');
      const index = medicines.findIndex((m: any) => m.id === medicineId);
      if (index !== -1) {
        medicines[index].status = 'completed';
        medicines[index].completed_at = new Date().toISOString();
        localStorage.setItem('demo_medicines', JSON.stringify(medicines));
      }
      return;
    }
    
    try {
      const { error } = await supabase
        .from('medicines')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', medicineId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Complete medicine error:', error);
      throw new Error(error.message || 'Failed to complete medicine');
    }
  }

  // Complete exercise
  async completeExercise(exerciseId: string): Promise<void> {
    if (this.DEMO_MODE) {
      const exercises = JSON.parse(localStorage.getItem('demo_exercises') || '[]');
      const index = exercises.findIndex((e: any) => e.id === exerciseId);
      if (index !== -1) {
        exercises[index].status = 'completed';
        exercises[index].completed_at = new Date().toISOString();
        localStorage.setItem('demo_exercises', JSON.stringify(exercises));
      }
      return;
    }
    
    try {
      const { error } = await supabase
        .from('exercises')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', exerciseId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Complete exercise error:', error);
      throw new Error(error.message || 'Failed to complete exercise');
    }
  }

  // Get BMI history
  async getBMIHistory(userId: string): Promise<any[]> {
    if (this.DEMO_MODE) {
      const records = JSON.parse(localStorage.getItem('demo_bmi_records') || '[]');
      return records.filter((r: any) => r.user_id === userId).reverse();
    }
    
    try {
      const { data, error } = await supabase
        .from('bmi_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get BMI history error:', error);
      return [];
    }
  }

  // Get user's medicines
  async getUserMedicines(userId: string): Promise<any[]> {
    if (this.DEMO_MODE) {
      const medicines = JSON.parse(localStorage.getItem('demo_medicines') || '[]');
      return medicines.filter((m: any) => m.user_id === userId).reverse();
    }
    
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get user medicines error:', error);
      return [];
    }
  }

  // Get user's exercises
  async getUserExercises(userId: string): Promise<any[]> {
    if (this.DEMO_MODE) {
      const exercises = JSON.parse(localStorage.getItem('demo_exercises') || '[]');
      return exercises.filter((e: any) => e.user_id === userId).reverse();
    }
    
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get user exercises error:', error);
      return [];
    }
  }
}

export const authService = new AuthService();