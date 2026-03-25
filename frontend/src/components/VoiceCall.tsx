import React, { useState, useEffect } from 'react';
import { X, PhoneOff, Settings, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { useWebRTC } from '../hooks/useWebRTC';

interface VideoCallProps {
  roomId: string;
  userId: string;
  onClose: () => void;
}

export const VideoCall: React.FC<VideoCallProps> = ({ roomId, userId, onClose }) => {
  const [showSettings, setShowSettings] = useState(false);
  const { localStream, isCameraActive, toggleCamera, toggleMicrophone, startLocalStream, stopStream, cameras, switchCamera } = useCamera();
  const { remoteStreams, isConnected, endAllCalls } = useWebRTC(roomId, userId, localStream);

  useEffect(() => {
    startLocalStream();
    return () => {
      stopStream();
      endAllCalls();
    };
  }, []);

  const handleEndCall = () => {
    stopStream();
    endAllCalls();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <span className="text-sm">{isConnected ? 'Connected' : 'Connecting...'}</span>
          <span className="text-sm text-gray-400 ml-2">Room: {roomId}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-gray-700 rounded-lg">
            <Settings size={20} />
          </button>
          <button onClick={handleEndCall} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg">
            <PhoneOff size={18} /> End Call
          </button>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg"><X size={20} /></button>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="flex-1 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            <div className="relative bg-gray-800 rounded-lg overflow-hidden">
              <video ref={(el) => { if (el && localStream) el.srcObject = localStream; }} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded">You</div>
            </div>
            {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
              <div key={userId} className="relative bg-gray-800 rounded-lg overflow-hidden">
                <video ref={(el) => { if (el && stream) el.srcObject = stream; }} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded">Remote</div>
              </div>
            ))}
          </div>
        </div>

        {showSettings && (
          <div className="w-80 bg-gray-800 p-4">
            <h3 className="text-white font-semibold mb-3">Camera Settings</h3>
            <select onChange={(e) => switchCamera(e.target.value)} className="w-full p-2 rounded bg-gray-700 text-white mb-4">
              {cameras.map(cam => <option key={cam.deviceId} value={cam.deviceId}>{cam.label}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={toggleCamera} className="flex-1 p-2 bg-gray-700 rounded text-white">{isCameraActive ? <Video /> : <VideoOff />}</button>
              <button onClick={toggleMicrophone} className="flex-1 p-2 bg-gray-700 rounded text-white">{localStream?.getAudioTracks()[0]?.enabled ? <Mic /> : <MicOff />}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
