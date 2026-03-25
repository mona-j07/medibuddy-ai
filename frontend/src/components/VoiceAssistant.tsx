import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, ChevronUp, ChevronDown, X } from 'lucide-react';
import { useVoice } from '../contexts/VoiceContext';

export const VoiceAssistant: React.FC = () => {
  const { 
    isListening, 
    startListening, 
    stopListening, 
    speak, 
    voiceEnabled, 
    toggleVoice, 
    transcript,
    isSpeechSupported 
  } = useVoice();
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    if (transcript) {
      setShowTranscript(true);
      setRecentCommands(prev => [transcript, ...prev].slice(0, 5));
      setTimeout(() => setShowTranscript(false), 3000);
    }
  }, [transcript]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
      speak("Voice input stopped");
    } else {
      startListening();
      speak("I'm listening. How can I help you?");
    }
  };

  const handleTestVoice = () => {
    speak("Hello! I'm your MediBuddy voice assistant. You can ask me to calculate BMI, add medicine, add exercise, or generate reports.");
  };

  const quickCommands = [
    { text: "Calculate BMI", command: "calculate bmi", action: () => speak("Opening BMI calculator") },
    { text: "Add Medicine", command: "add medicine", action: () => speak("Please enter medicine details") },
    { text: "Add Exercise", command: "add exercise", action: () => speak("Please enter exercise details") },
    { text: "Generate Report", command: "generate report", action: () => speak("Generating health report") },
    { text: "Test Voice", command: "test", action: handleTestVoice }
  ];

  if (!isSpeechSupported) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-gray-800 text-white rounded-lg p-3 text-sm shadow-lg">
          Voice not supported in this browser
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${isExpanded ? 'w-96' : 'w-auto'}`}>
      {/* Floating Voice Button (always visible) */}
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute bottom-0 right-0 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
        >
          {isListening ? (
            <div className="relative">
              <MicOff size={24} className="text-white animate-pulse" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
            </div>
          ) : (
            <Mic size={24} className="text-white" />
          )}
        </button>

        {/* Expanded Voice Assistant Panel */}
        {isExpanded && (
          <div className="absolute bottom-16 right-0 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-purple-600">
              <div className="flex items-center gap-2">
                <Volume2 size={20} className="text-white" />
                <span className="text-white font-semibold">Voice Assistant</span>
                {isListening && (
                  <span className="text-xs bg-white text-blue-600 px-2 py-0.5 rounded-full animate-pulse">
                    Listening...
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-4">
              {/* Voice Status and Controls */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handleToggleListening}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  <span className="text-sm font-medium">
                    {isListening ? 'Stop Listening' : 'Start Listening'}
                  </span>
                </button>
                
                <button
                  onClick={toggleVoice}
                  className={`flex items-center gap-1 px-3 py-2 rounded-full transition ${
                    voiceEnabled 
                      ? 'bg-green-100 dark:bg-green-900 text-green-600' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                  }`}
                  title={voiceEnabled ? 'Mute voice output' : 'Unmute voice output'}
                >
                  {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  <span className="text-xs">{voiceEnabled ? 'Voice ON' : 'Voice OFF'}</span>
                </button>
              </div>

              {/* Live Transcript */}
              {showTranscript && transcript && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg animate-pulse">
                  <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    <Mic size={14} /> "{transcript}"
                  </p>
                </div>
              )}

              {/* Quick Commands */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">QUICK COMMANDS</p>
                <div className="flex flex-wrap gap-2">
                  {quickCommands.map((cmd, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        cmd.action();
                        startListening();
                      }}
                      className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                      {cmd.text}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Commands */}
              {recentCommands.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">RECENT COMMANDS</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {recentCommands.map((cmd, idx) => (
                      <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        🎤 {cmd}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Voice Tips */}
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">💡 Voice Tips</p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <li>• Say "Calculate BMI" to open BMI calculator</li>
                  <li>• Say "Add medicine" to add a new medicine</li>
                  <li>• Say "Add exercise" to add a new exercise</li>
                  <li>• Say "Generate report" to create health report</li>
                  <li>• Say "Stop alarm" to silence reminders</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};