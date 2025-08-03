import React from 'react';

function ImageUploader({ onImageUpload }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onImageUpload(file);
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange}
        style={{margin: '20px'}}
      />
    </div>
  );
}

export default ImageUploader;