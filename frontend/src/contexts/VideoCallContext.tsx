import React, { createContext, useContext, useState, useCallback } from 'react';

interface VideoCallContextType {
  activeCall: {
    roomId: string;
    participantId: string;
  } | null;
  startCall: (participantId: string, roomId?: string) => void;
  endCall: () => void;
  isInCall: boolean;
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined);

export const useVideoCall = () => {
  const context = useContext(VideoCallContext);
  if (!context) throw new Error('useVideoCall must be used within VideoCallProvider');
  return context;
};

export const VideoCallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCall, setActiveCall] = useState<{ roomId: string; participantId: string } | null>(null);

  const startCall = useCallback((participantId: string, roomId?: string) => {
    const callRoomId = roomId || `call_${Date.now()}_${participantId}`;
    setActiveCall({ roomId: callRoomId, participantId });
  }, []);

  const endCall = useCallback(() => {
    setActiveCall(null);
  }, []);

  return (
    <VideoCallContext.Provider value={{
      activeCall,
      startCall,
      endCall,
      isInCall: !!activeCall
    }}>
      {children}
    </VideoCallContext.Provider>
  );
};