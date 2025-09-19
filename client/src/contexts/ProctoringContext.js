import React, { createContext, useContext, useState, useCallback } from 'react';
import io from 'socket.io-client';

const ProctoringContext = createContext();

export const useProctoring = () => {
  const context = useContext(ProctoringContext);
  if (!context) {
    throw new Error('useProctoring must be used within a ProctoringProvider');
  }
  return context;
};

export const ProctoringProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [isProctoring, setIsProctoring] = useState(false);
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const connectSocket = useCallback(() => {
    if (!socket) {
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      newSocket.on('proctoring-alert', (data) => {
        setAlerts(prev => [...prev, { ...data, id: Date.now() }]);
        setEvents(prev => [...prev, data]);
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
      });
    }
  }, [socket]);

  const disconnectSocket = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  }, [socket]);

  const startProctoring = async (candidateName, interviewerName) => {
    try {
      const response = await fetch('/api/proctoring/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateName,
          interviewerName,
          metadata: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentSession(data.session);
        setIsProctoring(true);
        connectSocket();
        
        if (socket) {
          socket.emit('join-session', data.session.id);
        }
        
        return { success: true, session: data.session };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      console.error('Error starting proctoring:', error);
      return { success: false, message: 'Failed to start proctoring session' };
    }
  };

  const stopProctoring = async () => {
    if (!currentSession) return { success: false, message: 'No active session' };

    try {
      const response = await fetch('/api/proctoring/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: currentSession.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsProctoring(false);
        disconnectSocket();
        setCurrentSession(null);
        setEvents([]);
        setAlerts([]);
        
        return { success: true, session: data.session };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      console.error('Error stopping proctoring:', error);
      return { success: false, message: 'Failed to stop proctoring session' };
    }
  };

  const logEvent = async (eventData) => {
    if (!currentSession) return;

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: currentSession.id,
          ...eventData
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error logging event:', error);
      return { success: false, message: 'Failed to log event' };
    }
  };

  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const value = {
    socket,
    currentSession,
    isProctoring,
    events,
    alerts,
    startProctoring,
    stopProctoring,
    logEvent,
    dismissAlert,
    connectSocket,
    disconnectSocket
  };

  return (
    <ProctoringContext.Provider value={value}>
      {children}
    </ProctoringContext.Provider>
  );
};
