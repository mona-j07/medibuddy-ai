import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useWebRTC = (roomId: string, userId: string, localStream: MediaStream | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peers, setPeers] = useState<Map<string, RTCPeerConnection>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
    iceCandidatePoolSize: 10
  };

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000');
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      console.log('Connected to signaling server');
      setIsConnected(true);
      newSocket.emit('join-room', { roomId, userId });
    });

    return () => {
      newSocket.disconnect();
      peerConnectionsRef.current.forEach(pc => pc.close());
    };
  }, [roomId, userId]);

  useEffect(() => {
    if (!socket) return;

    socket.on('existing-participants', (participants: string[]) => {
      participants.forEach(participantId => {
        if (participantId !== userId && localStream) {
          createPeerConnection(participantId, localStream);
        }
      });
    });

    socket.on('user-joined', (participantId: string) => {
      if (participantId !== userId && localStream) {
        createPeerConnection(participantId, localStream);
      }
    });

    socket.on('offer', async ({ from, offer }) => {
      if (localStream) {
        const pc = await createPeerConnection(from, localStream, true);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { to: from, answer });
      }
    });

    socket.on('answer', async ({ from, answer }) => {
      const pc = peers.get(from);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('ice-candidate', async ({ from, candidate }) => {
      const pc = peers.get(from);
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    });

    socket.on('user-left', (participantId: string) => {
      const pc = peers.get(participantId);
      if (pc) {
        pc.close();
        peers.delete(participantId);
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          newMap.delete(participantId);
          return newMap;
        });
      }
    });

    return () => {
      socket.off('existing-participants');
      socket.off('user-joined');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-left');
    };
  }, [socket, localStream]);

  const createPeerConnection = async (participantId: string, stream: MediaStream, isReceiver = false) => {
    const pc = new RTCPeerConnection(configuration);
    
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          to: participantId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.set(participantId, event.streams[0]);
        return newMap;
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        pc.close();
        peers.delete(participantId);
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          newMap.delete(participantId);
          return newMap;
        });
      }
    };

    peerConnectionsRef.current.set(participantId, pc);
    setPeers(prev => new Map(prev).set(participantId, pc));

    if (!isReceiver && socket) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', { to: participantId, offer });
    }

    return pc;
  };

  const endAllCalls = () => {
    peers.forEach((pc) => pc.close());
    peers.clear();
    setRemoteStreams(new Map());
    if (socket) {
      socket.emit('leave-room', { roomId, userId });
    }
  };

  return {
    peers,
    remoteStreams,
    isConnected,
    endAllCalls
  };
};