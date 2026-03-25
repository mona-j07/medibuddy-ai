import { useState, useEffect, useRef } from 'react';

interface CameraDevice {
  deviceId: string;
  label: string;
  kind: string;
}

export const useCamera = () => {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [microphones, setMicrophones] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      
      setCameras(videoDevices.map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${videoDevices.indexOf(device) + 1}`,
        kind: device.kind
      })));
      
      setMicrophones(audioDevices.map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone ${audioDevices.indexOf(device) + 1}`,
        kind: device.kind
      })));
      
      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
      if (audioDevices.length > 0 && !selectedMicrophone) {
        setSelectedMicrophone(audioDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Error getting devices:', err);
      setError('Could not access camera/microphone');
    }
  };

  const startLocalStream = async (cameraId?: string, micId?: string) => {
    try {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: cameraId ? { deviceId: { exact: cameraId } } : true,
        audio: micId ? { deviceId: { exact: micId } } : true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setIsCameraActive(true);
      setError(null);
      return stream;
    } catch (err) {
      console.error('Error starting stream:', err);
      setError('Could not access camera/microphone. Please check permissions.');
      setIsCameraActive(false);
      return null;
    }
  };

  const switchCamera = async (cameraId: string) => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) videoTrack.stop();
    }
    setSelectedCamera(cameraId);
    return await startLocalStream(cameraId, selectedMicrophone);
  };

  const switchMicrophone = async (micId: string) => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) audioTrack.stop();
    }
    setSelectedMicrophone(micId);
    return await startLocalStream(selectedCamera, micId);
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraActive(videoTrack.enabled);
      }
    }
  };

  const toggleMicrophone = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = !audioTrack.enabled;
    }
  };

  const stopStream = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    navigator.mediaDevices.addEventListener('devicechange', getDevices);
    getDevices();
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getDevices);
      if (localStream) localStream.getTracks().forEach(track => track.stop());
    };
  }, []);

  return {
    cameras,
    microphones,
    selectedCamera,
    selectedMicrophone,
    localStream,
    isCameraActive,
    error,
    startLocalStream,
    switchCamera,
    switchMicrophone,
    toggleCamera,
    toggleMicrophone,
    stopStream
  };
};