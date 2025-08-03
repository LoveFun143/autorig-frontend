import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';

function App() {
  const [image, setImage] = useState(null);

  return (
    <div style={{padding: '20px', textAlign: 'center'}}>
      <h1>AutoRig Demo v1.0</h1>
      <p>Upload an image to get started</p>
      <ImageUploader onImageUpload={setImage} />
      {image && <p>Image uploaded: {image.name}</p>}
    </div>
  );
}

export default App;
