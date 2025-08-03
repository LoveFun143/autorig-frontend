// src/App.js
import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import ImageAnalyzer from './components/ImageAnalyzer';
import CharacterPreview from './components/CharacterPreview';

function App() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [segmentedLayers, setSegmentedLayers] = useState(null);
  const [riggedModel, setRiggedModel] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showAnalysisDetails, setShowAnalysisDetails] = useState(false);

  const handleImageUpload = async (imageFile) => {
    setProcessing(true);
    setError(null);
    setUploadedImage(imageFile);
    setAnalysisResults(null);
    setSegmentedLayers(null);
    setRiggedModel(null);
    
    try {
      console.log('🔍 Step 1: Frontend image analysis...');
      
      // Step 1: Real frontend image analysis
      const analyzer = new ImageAnalyzer();
      const frontendAnalysis = await analyzer.analyzeImage(imageFile);
      setAnalysisResults(frontendAnalysis);
      
      console.log('📤 Step 2: Sending to backend with analysis...');
      
      // Step 2: Send to backend with frontend analysis
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('frontendAnalysis', JSON.stringify(frontendAnalysis));
      
      const response = await fetch('https://autorig-backend-production.up.railway.app/process-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Backend processing failed');
      }
      
      const result = await response.
