import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';

function App() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [segmentedLayers, setSegmentedLayers] = useState(null);
  const [riggedModel, setRiggedModel] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleImageUpload = async (imageFile) => {
    setProcessing(true);
    setError(null);
    setUploadedImage(imageFile);
    
    try {
      // Send to backend for processing
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/process-image`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Processing failed');
      }
      
      const result = await response.json();
      setSegmentedLayers(result.layers);
      setRiggedModel(result.riggedModel);
    } catch (error) {
      console.error('Processing failed:', error);
      setError('Processing failed. Please try again.');
    }
    
    setProcessing(false);
  };

  return (
    <div style={{padding: '20px', textAlign: 'center', maxWidth: '800px', margin: '0 auto'}}>
      <h1>AutoRig Demo v1.0</h1>
      <p>Upload an image → Get a rigged 2D character</p>
      
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
          <p>This may take 30-60 seconds</p>
        </div>
      )}
      
      {error && (
        <div style={{marginBottom: '20px', color: 'red'}}>
          <p>❌ {error}</p>
        </div>
      )}
      
      {segmentedLayers && (
        <div style={{marginBottom: '20px'}}>
          <h3>✅ Processing Complete!</h3>
          <div style={{textAlign: 'left', backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '5px'}}>
            <h4>Segmented Layers:</h4>
            <ul>
              {segmentedLayers.map((layer, index) => (
                <li key={index}>{layer.name}</li>
              ))}
            </ul>
            
            {riggedModel && (
              <div>
                <h4>Rigged Model:</h4>
                <p>Bones: {riggedModel.bones?.length || 0}</p>
                <p>Animations: {riggedModel.animations?.join(', ') || 'None'}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
