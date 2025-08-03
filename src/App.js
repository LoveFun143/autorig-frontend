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
      
      const result = await response.json();
      console.log('📦 Backend response:', result);
      setSegmentedLayers(result.layers);
      setRiggedModel(result.riggedModel);
      
      console.log('✅ Complete processing finished!');
      
    } catch (error) {
      console.error('Processing failed:', error);
      setError('Processing failed. Please try again.');
    }
    
    setProcessing(false);
  };

  const renderAnalysisDetails = () => {
    if (!analysisResults) return null;
    
    const { basicInfo, colorAnalysis, features, quality, suggestions } = analysisResults;
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Analysis Details</h3>
          <button
            onClick={() => setShowAnalysisDetails(!showAnalysisDetails)}
            className="text-blue-500 hover:text-blue-700"
          >
            {showAnalysisDetails ? 'Hide' : 'Show'} Details
          </button>
        </div>
        
        {showAnalysisDetails && (
          <div className="space-y-4">
            {/* Basic Info */}
            <div>
              <h4 className="font-medium mb-2">Image Info</h4>
              <p className="text-sm text-gray-600">
                Dimensions: {basicInfo.width} × {basicInfo.height}px | 
                Aspect: {basicInfo.aspectRatio} | 
                Format: {basicInfo.format}
              </p>
            </div>
            
            {/* Color Analysis */}
            <div>
              <h4 className="font-medium mb-2">Color Palette</h4>
              <div className="flex gap-2">
                {colorAnalysis.dominantColors.map((color, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded border"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            
            {/* Features */}
            <div>
              <h4 className="font-medium mb-2">Detected Features</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(features).map(([key, value]) => (
                  value && (
                    <span key={key} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  )
                ))}
              </div>
            </div>
            
            {/* Quality Metrics */}
            <div>
              <h4 className="font-medium mb-2">Quality Metrics</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Overall Score:</span>
                  <span className="font-medium">{quality.score}/100</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Clarity:</span>
                  <span>{quality.clarity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Lighting:</span>
                  <span>{quality.lighting}</span>
                </div>
              </div>
            </div>
            
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Suggestions</h4>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {suggestions.map((suggestion, i) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            ✨ Auto Rig Character Creator ✨
          </h1>
          <p className="text-gray-600">
            Upload your avatar and watch the magic happen!
          </p>
        </header>

        <div className="max-w-6xl mx-auto">
          {/* Image Upload Section */}
          {!uploadedImage && (
            <ImageUploader onImageUpload={handleImageUpload} />
          )}

          {/* Processing/Results Section */}
          {uploadedImage && (
            <div className="space-y-6">
              {/* Analysis Details (collapsible) */}
              {analysisResults && renderAnalysisDetails()}

              {/* Character Preview with Processing Messages */}
              <CharacterPreview
                uploadedImage={uploadedImage}
                analysisResults={analysisResults}
                segmentedLayers={segmentedLayers}
                riggedModel={riggedModel}
                processing={processing}
                error={error}
              />

              {/* Reset Button */}
              {!processing && (
                <div className="text-center">
                  <button
                    onClick={() => {
                      setUploadedImage(null);
                      setAnalysisResults(null);
                      setSegmentedLayers(null);
                      setRiggedModel(null);
                      setError(null);
                    }}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Start Over with New Image
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Made with 💖 by Auto Rig Team</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
