// src/App.js - Simple Test Version
import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import FaceDetector from './components/FaceDetector';

function App() {
  console.log("🔴 APP.JS IS RUNNING - TEST VERSION");  // TEST LINE
  
  const [uploadedImage, setUploadedImage] = useState(null);
  const [faceData, setFaceData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleImageUpload = async (imageFile) => {
    console.log("📸 Image uploaded:", imageFile.name);  // TEST LINE
    setProcessing(true);
    setError(null);
    setFaceData(null);
    
    try {
      // Create image URL
      const imageUrl = URL.createObjectURL(imageFile);
      setUploadedImage(imageUrl);
      
      // Test face detection
      console.log('🎯 Testing face detection...');
      const detector = new FaceDetector();
      const result = await detector.detectFace(imageUrl);
      
      if (result) {
        console.log('✅ Face detected!', result);
        setFaceData(result);
      } else {
        setError('No face detected. Try a different image.');
      }
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    }
    
    setProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎭 Face Detection Test NEW VERSION
          </h1>
        </header>

        <div className="max-w-2xl mx-auto">
          {!uploadedImage && (
            <ImageUploader onImageUpload={handleImageUpload} />
          )}

          {uploadedImage && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <i
