import { useEffect, useState, useRef, useCallback } from 'react';
import { useVoice } from '../contexts/VoiceContext';

export interface Reminder {
  id: string;
  type: 'medicine' | 'exercise';
  name: string;
  details: string;
  time: string;
  status?: 'pending' | 'completed';
  createdAt?: string;
}

interface UseReminderReturn {
  activeReminder: Reminder | null;
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'status' | 'createdAt'>) => void;
  removeReminder: (id: string) => void;
  markComplete: (id: string, type: string) => Promise<void>;
  stopAlarm: () => void;
  playAlarm: () => void;
  scheduleReminders: () => void;
}

export const useReminder = (): UseReminderReturn => {
  const [activeReminder, setActiveReminder] = useState<Reminder | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { speak, voiceEnabled } = useVoice();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Load reminders from localStorage
  useEffect(() => {
    const savedReminders = localStorage.getItem('medibuddy_reminders');
    if (savedReminders) {
      try {
        const parsed: Reminder[] = JSON.parse(savedReminders);
        setReminders(parsed);
      } catch (e) {
        console.error('Error loading reminders:', e);
      }
    }

    const savedActiveReminder = localStorage.getItem('active_reminder');
    if (savedActiveReminder) {
      try {
        const reminder: Reminder = JSON.parse(savedActiveReminder);
        setActiveReminder(reminder);
        playAlarm();
        speak(`Reminder: Time for your ${reminder.type} - ${reminder.name}`);
      } catch (e) {
        console.error('Error loading active reminder:', e);
      }
    }
  }, []);

  // Save reminders to localStorage
  useEffect(() => {
    localStorage.setItem('medibuddy_reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Save active reminder
  useEffect(() => {
    if (activeReminder) {
      localStorage.setItem('active_reminder', JSON.stringify(activeReminder));
    } else {
      localStorage.removeItem('active_reminder');
    }
  }, [activeReminder]);

  // Play alarm
  const playAlarm = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      
      oscillator.frequency.value = 880;
      gain.gain.value = 0.5;
      
      oscillator.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 2);
      
      (window as any).currentAlarm = audioContext;
    } catch (error) {
      console.error('Error playing alarm:', error);
    }
  }, []);

  // Stop alarm
  const stopAlarm = useCallback(() => {
    try {
      if ((window as any).currentAlarm) {
        (window as any).currentAlarm.close();
        (window as any).currentAlarm = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } catch (error) {
      console.error('Error stopping alarm:', error);
    }
  }, []);

  // Trigger reminder
  const triggerReminder = useCallback((reminder: Reminder) => {
    setActiveReminder(reminder);
    playAlarm();
    
    const message = `Time for your ${reminder.type}: ${reminder.name}. ${reminder.details}`;
    
    if (voiceEnabled) {
      speak(message);
    }
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('MediBuddy Reminder', {
        body: `${reminder.type.toUpperCase()}: ${reminder.name}`,
        icon: '/vite.svg'
      });
    }
    
    window.dispatchEvent(new CustomEvent('reminder-triggered', { detail: reminder }));
    
    const autoDismissTimeout = setTimeout(() => {
      if (activeReminder?.id === reminder.id) {
        stopAlarm();
        setActiveReminder(null);
      }
    }, 300000);
    
    timeoutRefs.current.set(reminder.id, autoDismissTimeout);
  }, [playAlarm, speak, voiceEnabled, activeReminder, stopAlarm]);

  // Schedule reminder
  const scheduleReminder = useCallback((reminder: Reminder) => {
    const [hours, minutes] = reminder.time.split(':').map(Number);
    const now = new Date();
    let reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);
    
    let timeUntil = reminderTime.getTime() - now.getTime();
    
    if (timeUntil < 0) {
      reminderTime.setDate(reminderTime.getDate() + 1);
      timeUntil = reminderTime.getTime() - now.getTime();
    }
    
    if (timeoutRefs.current.has(reminder.id)) {
      clearTimeout(timeoutRefs.current.get(reminder.id));
    }
    
    const timeout = setTimeout(() => {
      triggerReminder(reminder);
    }, timeUntil);
    
    timeoutRefs.current.set(reminder.id, timeout);
  }, [triggerReminder]);

  // Schedule all reminders
  const scheduleReminders = useCallback(() => {
    timeoutRefs.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    timeoutRefs.current.clear();
    
    reminders.forEach(reminder => {
      if (reminder.status !== 'completed') {
        scheduleReminder(reminder);
      }
    });
  }, [reminders, scheduleReminder]);

  // Add reminder
  const addReminder = useCallback((reminder: Omit<Reminder, 'status' | 'createdAt'>) => {
    const newReminder: Reminder = { 
      ...reminder, 
      status: 'pending', 
      createdAt: new Date().toISOString() 
    };
    setReminders(prev => [...prev, newReminder]);
    scheduleReminder(newReminder);
    speak(`Reminder added for ${reminder.name} at ${reminder.time}`);
  }, [scheduleReminder, speak]);

  // Remove reminder
  const removeReminder = useCallback((id: string) => {
    if (timeoutRefs.current.has(id)) {
      clearTimeout(timeoutRefs.current.get(id));
      timeoutRefs.current.delete(id);
    }
    
    setReminders(prev => prev.filter(r => r.id !== id));
    
    if (activeReminder?.id === id) {
      stopAlarm();
      setActiveReminder(null);
    }
  }, [activeReminder, stopAlarm]);

  // Mark complete
  const markComplete = useCallback(async (id: string, type: string) => {
    try {
      const endpoint = type === 'medicine' ? '/api/medicine/complete' : '/api/exercise/complete';
      await fetch(`http://localhost:5000${endpoint}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      setReminders(prev => prev.map(r => 
        r.id === id ? { ...r, status: 'completed' as const } : r
      ));
      
      if (activeReminder?.id === id) {
        stopAlarm();
        setActiveReminder(null);
      }
      
      if (timeoutRefs.current.has(id)) {
        clearTimeout(timeoutRefs.current.get(id));
        timeoutRefs.current.delete(id);
      }
      
      speak(`${type} marked as completed!`);
    } catch (error) {
      console.error('Error marking complete:', error);
      setReminders(prev => prev.map(r => 
        r.id === id ? { ...r, status: 'completed' as const } : r
      ));
      if (activeReminder?.id === id) {
        stopAlarm();
        setActiveReminder(null);
      }
    }
  }, [activeReminder, stopAlarm, speak]);

  // Check reminders every minute
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      reminders.forEach(reminder => {
        if (reminder.status !== 'completed' && reminder.time === currentTime && !activeReminder) {
          triggerReminder(reminder);
        }
      });
    };
    
    intervalRef.current = setInterval(checkReminders, 60000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [reminders, triggerReminder, activeReminder]);

  // Reschedule reminders
  useEffect(() => {
    scheduleReminders();
  }, [scheduleReminders]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
      timeoutRefs.current.clear();
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopAlarm();
    };
  }, [stopAlarm]);

  return {
    activeReminder,
    reminders,
    addReminder,
    removeReminder,
    markComplete,
    stopAlarm,
    playAlarm,
    scheduleReminders
  };
};