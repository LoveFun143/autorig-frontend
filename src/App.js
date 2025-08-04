// src/App.js - Simple Test Version
import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import FaceDetector from './components/FaceDetector';

function App() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [faceData, setFaceData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleImageUpload = async (imageFile) => {
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
            🎭 Face Detection Test
          </h1>
        </header>

        <div className="max-w-2xl mx-auto">
          {!uploadedImage && (
            <ImageUploader onImageUpload={handleImageUpload} />
          )}

          {uploadedImage && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <img 
                src={uploadedImage} 
                alt="Uploaded" 
                className="max-w-full h-auto mx-auto mb-4"
                style={{ maxHeight: '400px' }}
              />
              
              {processing && <p className="text-center">Detecting face...</p>}
              
              {faceData && (
                <div className="bg-green-50 p-4 rounded">
                  <p className="text-green-600">✅ Face Detected!</p>
                  <p className="text-sm">Keypoints: {faceData.numKeypoints}</p>
                  <p className="text-sm">
                    Bounds: {Math.round(faceData.bounds.width)}x{Math.round(faceData.bounds.height)}
                  </p>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 p-4 rounded">
                  <p className="text-red-600">❌ {error}</p>
                </div>
              )}
              
              <button
                onClick={() => {
                  setUploadedImage(null);
                  setFaceData(null);
                  setError(null);
                }}
                className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Try Another Image
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
