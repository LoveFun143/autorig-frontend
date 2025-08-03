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
      setSegmentedLayers(result.layers);
      setRiggedModel(result.riggedModel);
        <CharacterPreview
    originalImage={uploadedImage}
    segmentedLayers={segmentedLayers}
    riggedModel={riggedModel}
    analysisResults={analysisResults}
  />
)}
      console.log('✅ Complete processing finished!');
      
    } catch (error) {
      console.error('Processing failed:', error);
      setError('Processing failed. Please try again.');
    }
    
    setProcessing(false);
  };

  // src/App.js - Updated renderAnalysisDetails function
const renderAnalysisDetails = () => {
  if (!analysisResults) return null;
  
  const { basicInfo, colorAnalysis, complexityScore, objectDetections, characterFeatures, trueRecognition } = analysisResults;
  
  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px',
      textAlign: 'left',
      fontSize: '14px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>🧠 TRUE AI Recognition Results</h4>
      
      {trueRecognition && (
        <div style={{ backgroundColor: '#e7f3ff', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
          <strong>🎯 ACTUAL DETECTIONS:</strong><br/>
          <strong>Objects:</strong> {trueRecognition.detectedObjects.join(', ') || 'None'}<br/>
          <strong>Character Type:</strong> {trueRecognition.characterType}<br/>
          <strong>Style:</strong> {trueRecognition.styleDetected}<br/>
          <strong>Special Features:</strong> {trueRecognition.specialFeatures.join(', ') || 'None'}<br/>
          <strong>AI Confidence:</strong> {Math.round(trueRecognition.confidence * 100)}%
        </div>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
        <div>
          <strong>📏 Image Info:</strong><br/>
          {basicInfo.width}×{basicInfo.height} ({basicInfo.resolution})<br/>
          Type: {basicInfo.isPortrait ? 'Portrait' : basicInfo.isLandscape ? 'Landscape' : 'Square'}
        </div>
        
        <div>
          <strong>🎨 Colors:</strong><br/>
          Complexity: {colorAnalysis.colorComplexity}<br/>
          Brightness: {colorAnalysis.isDark ? 'Dark' : colorAnalysis.isBright ? 'Bright' : 'Normal'}
        </div>
        
        <div>
          <strong>👥 People Detected:</strong><br/>
          Count: {objectDetections?.people?.length || 0}<br/>
          {objectDetections?.people?.[0] && `Confidence: ${Math.round(objectDetections.people[0].confidence * 100)}%`}
        </div>
        
        <div>
          <strong>👕 Clothing Detected:</strong><br/>
          Items: {objectDetections?.clothing?.length || 0}<br/>
          {objectDetections?.clothing?.map(c => c.type).join(', ') || 'None'}
        </div>
        
        <div>
          <strong>🎭 Style Analysis:</strong><br/>
          {characterFeatures?.animeFeatures?.hasAnimeStyle ? 'Anime Style' : 'Other Style'}<br/>
          {characterFeatures?.animeFeatures?.animeConfidence && 
            `(${Math.round(characterFeatures.animeFeatures.animeConfidence * 100)}%)`}
        </div>
        
        <div>
          <strong>⚡ Complexity:</strong><br/>
          Score: {Math.round(complexityScore.complexityScore)}<br/>
          {complexityScore.isHighlyDetailed ? 'Highly Detailed' : complexityScore.isDetailed ? 'Detailed' : 'Simple'}
        </div>
      </div>
    </div>
  );
};

  return (
    <div style={{padding: '20px', textAlign: 'center', maxWidth: '1000px', margin: '0 auto'}}>
      <h1>AutoRig Demo v2.0 - Real Analysis</h1>
      <p>Upload an image → Real AI analysis → Get a rigged 2D character</p>
      
      <div style={{marginBottom: '20px'}}>
        <ImageUploader onImageUpload={handleImageUpload} />
      </div>
      
      {uploadedImage && (
        <div style={{marginBottom: '20px'}}>
          <p>✅ Image uploaded: {uploadedImage.name}</p>
        </div>
      )}
      
      {processing && (
        <div style={{marginBottom: '20px'}}>
          <h3>🔄 Processing your image...</h3>
          <p>Real-time analysis in progress...</p>
          {analysisResults && <p>✅ Frontend analysis complete, sending to backend...</p>}
        </div>
      )}
      
      {error && (
        <div style={{marginBottom: '20px', color: 'red'}}>
          <p>❌ {error}</p>
        </div>
      )}
      
      {analysisResults && (
        <div style={{marginBottom: '20px'}}>
          <button 
            onClick={() => setShowAnalysisDetails(!showAnalysisDetails)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            {showAnalysisDetails ? 'Hide' : 'Show'} Analysis Details
          </button>
          
          {showAnalysisDetails && renderAnalysisDetails()}
        </div>
      )}
      
      {segmentedLayers && (
        <div style={{marginBottom: '20px'}}>
          <h3>✅ Processing Complete!</h3>
          <div style={{textAlign: 'left', backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '5px'}}>
            <h4>Segmented Layers:</h4>
            <ul>
              {segmentedLayers.map((layer, index) => (
                <li key={index}>
                  {layer.name} 
                  {layer.confidence && (
                    <span style={{color: '#666', fontSize: '12px'}}>
                      {' '}({Math.round(layer.confidence * 100)}% confidence)
                    </span>
                  )}
                </li>
              ))}
            </ul>
            
            {riggedModel && (
              <div>
                <h4>Rigged Model:</h4>
                <p>Bones: {riggedModel.bones?.length || 0}</p>
                <p>Animations: {riggedModel.animations?.join(', ') || 'None'}</p>
                {riggedModel.quality && <p>Quality: {riggedModel.quality}</p>}
                {riggedModel.rigType && <p>Rig Type: {riggedModel.rigType}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;


