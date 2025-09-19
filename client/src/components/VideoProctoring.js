import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import { useProctoring } from '../contexts/ProctoringContext';

const VideoProctoring = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const { currentSession, logEvent } = useProctoring();
  
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionStats, setDetectionStats] = useState({
    focusLost: 0,
    faceAbsent: 0,
    multipleFaces: 0,
    phoneDetected: 0,
    bookDetected: 0,
    deviceDetected: 0,
    drowsiness: 0
  });

  // Detection state
  const [lastFaceTime, setLastFaceTime] = useState(Date.now());
  const [lastFocusTime, setLastFocusTime] = useState(Date.now());
  const [faceAbsentStart, setFaceAbsentStart] = useState(null);
  const [focusLostStart, setFocusLostStart] = useState(null);
  const [isLookingAway, setIsLookingAway] = useState(false);
  const [isDrowsy, setIsDrowsy] = useState(false);

  // Load TensorFlow.js models
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      // Load COCO-SSD model for object detection
      const model = await tf.loadLayersModel('/models/coco-ssd/model.json');
      console.log('Object detection model loaded');
      
      // Load face detection model
      const faceModel = await tf.loadLayersModel('/models/face-detection/model.json');
      console.log('Face detection model loaded');
      
      setIsDetecting(true);
    } catch (error) {
      console.error('Error loading models:', error);
      // Fallback to basic detection without models
      setIsDetecting(true);
    }
  };

  // Face detection using basic computer vision
  const detectFace = useCallback((video) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!canvas || !ctx) return { hasFace: false, isLookingAway: false, isDrowsy: false };

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Simple face detection using skin tone detection
    let facePixels = 0;
    let totalPixels = 0;
    let centerX = 0;
    let centerY = 0;
    let facePixelsX = 0;
    let facePixelsY = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Simple skin tone detection
      if (r > 95 && g > 40 && b > 20 && 
          r > g && r > b && 
          Math.abs(r - g) > 15 && 
          r - g > 15) {
        facePixels++;
        const pixelIndex = i / 4;
        const x = pixelIndex % canvas.width;
        const y = Math.floor(pixelIndex / canvas.width);
        facePixelsX += x;
        facePixelsY += y;
      }
      totalPixels++;
    }

    const hasFace = facePixels > totalPixels * 0.05; // At least 5% of pixels are skin tone
    const faceCenterX = facePixels > 0 ? facePixelsX / facePixels : canvas.width / 2;
    const faceCenterY = facePixels > 0 ? facePixelsY / facePixels : canvas.height / 2;
    
    // Check if looking away (face not centered)
    const centerThreshold = canvas.width * 0.3;
    const isLookingAway = Math.abs(faceCenterX - canvas.width / 2) > centerThreshold;
    
    // Simple drowsiness detection (face too low or too high)
    const drowsinessThreshold = canvas.height * 0.4;
    const isDrowsy = Math.abs(faceCenterY - canvas.height / 2) > drowsinessThreshold;

    return { hasFace, isLookingAway, isDrowsy, faceCenterX, faceCenterY };
  }, []);

  // Object detection for phones, books, etc.
  const detectObjects = useCallback((video) => {
    // This is a simplified version - in a real implementation, you would use
    // a trained YOLO or COCO-SSD model
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!canvas || !ctx) return { phoneDetected: false, bookDetected: false, deviceDetected: false };

    // Simple edge detection for rectangular objects
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let edges = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      
      // Simple edge detection
      if (i > 0 && Math.abs(brightness - ((data[i-4] + data[i-3] + data[i-2]) / 3)) > 30) {
        edges++;
      }
    }

    // Very basic object detection based on edge density
    const edgeDensity = edges / (data.length / 4);
    const phoneDetected = edgeDensity > 0.1; // Arbitrary threshold
    const bookDetected = edgeDensity > 0.08;
    const deviceDetected = edgeDensity > 0.12;

    return { phoneDetected, bookDetected, deviceDetected };
  }, []);

  // Main detection loop
  const runDetection = useCallback(async () => {
    if (!webcamRef.current || !isDetecting || !currentSession) return;

    const video = webcamRef.current.video;
    if (!video || video.readyState !== 4) {
      requestAnimationFrame(runDetection);
      return;
    }

    try {
      // Face detection
      const faceResult = detectFace(video);
      
      // Object detection
      const objectResult = detectObjects(video);

      // Handle face absence
      if (!faceResult.hasFace) {
        if (!faceAbsentStart) {
          setFaceAbsentStart(Date.now());
        } else if (Date.now() - faceAbsentStart > 10000) { // 10 seconds
          await logEvent({
            eventType: 'face_absent',
            severity: 'high',
            description: 'Face not detected for more than 10 seconds',
            confidence: 0.8
          });
          setDetectionStats(prev => ({ ...prev, faceAbsent: prev.faceAbsent + 1 }));
          setFaceAbsentStart(null);
        }
      } else {
        setFaceAbsentStart(null);
        setLastFaceTime(Date.now());
      }

      // Handle focus loss (looking away)
      if (faceResult.isLookingAway) {
        if (!focusLostStart) {
          setFocusLostStart(Date.now());
        } else if (Date.now() - focusLostStart > 5000) { // 5 seconds
          await logEvent({
            eventType: 'focus_lost',
            severity: 'medium',
            description: 'Looking away from screen for more than 5 seconds',
            confidence: 0.7
          });
          setDetectionStats(prev => ({ ...prev, focusLost: prev.focusLost + 1 }));
          setFocusLostStart(null);
        }
      } else {
        setFocusLostStart(null);
        setLastFocusTime(Date.now());
      }

      // Handle drowsiness
      if (faceResult.isDrowsy && !isDrowsy) {
        setIsDrowsy(true);
        await logEvent({
          eventType: 'drowsiness_detected',
          severity: 'medium',
          description: 'Drowsiness detected - head position indicates sleepiness',
          confidence: 0.6
        });
        setDetectionStats(prev => ({ ...prev, drowsiness: prev.drowsiness + 1 }));
      } else if (!faceResult.isDrowsy && isDrowsy) {
        setIsDrowsy(false);
      }

      // Handle object detection
      if (objectResult.phoneDetected) {
        await logEvent({
          eventType: 'phone_detected',
          severity: 'high',
          description: 'Mobile phone detected in frame',
          confidence: 0.5
        });
        setDetectionStats(prev => ({ ...prev, phoneDetected: prev.phoneDetected + 1 }));
      }

      if (objectResult.bookDetected) {
        await logEvent({
          eventType: 'book_detected',
          severity: 'high',
          description: 'Book or notes detected in frame',
          confidence: 0.5
        });
        setDetectionStats(prev => ({ ...prev, bookDetected: prev.bookDetected + 1 }));
      }

      if (objectResult.deviceDetected) {
        await logEvent({
          eventType: 'device_detected',
          severity: 'high',
          description: 'Electronic device detected in frame',
          confidence: 0.5
        });
        setDetectionStats(prev => ({ ...prev, deviceDetected: prev.deviceDetected + 1 }));
      }

      // Draw detection overlays
      drawOverlays(faceResult, objectResult);

    } catch (error) {
      console.error('Detection error:', error);
    }

    // Continue detection loop
    requestAnimationFrame(runDetection);
  }, [isDetecting, currentSession, detectFace, detectObjects, logEvent, faceAbsentStart, focusLostStart, isDrowsy]);

  // Draw detection overlays on canvas
  const drawOverlays = useCallback((faceResult, objectResult) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!canvas || !ctx) return;

    // Clear previous overlays
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw face detection overlay
    if (faceResult.hasFace) {
      ctx.strokeStyle = faceResult.isLookingAway ? '#ff9800' : '#4caf50';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        faceResult.faceCenterX - 50,
        faceResult.faceCenterY - 50,
        100,
        100
      );
    }

    // Draw status indicators
    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';
    ctx.fillText(`Focus: ${faceResult.isLookingAway ? 'LOST' : 'OK'}`, 10, 30);
    ctx.fillText(`Face: ${faceResult.hasFace ? 'DETECTED' : 'ABSENT'}`, 10, 50);
    ctx.fillText(`Drowsy: ${faceResult.isDrowsy ? 'YES' : 'NO'}`, 10, 70);
  }, []);

  // Start detection when component mounts
  useEffect(() => {
    if (isDetecting && currentSession) {
      runDetection();
    }
  }, [isDetecting, currentSession, runDetection]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Webcam
        ref={webcamRef}
        audio={false}
        width="100%"
        height="auto"
        style={{ borderRadius: '8px' }}
        videoConstraints={{
          width: 1280,
          height: 720,
          facingMode: 'user'
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          borderRadius: '8px'
        }}
      />
      
      {/* Detection Status */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <div>Focus Lost: {detectionStats.focusLost}</div>
        <div>Face Absent: {detectionStats.faceAbsent}</div>
        <div>Phone: {detectionStats.phoneDetected}</div>
        <div>Books: {detectionStats.bookDetected}</div>
        <div>Devices: {detectionStats.deviceDetected}</div>
        <div>Drowsy: {detectionStats.drowsiness}</div>
      </div>
    </div>
  );
};

export default VideoProctoring;
