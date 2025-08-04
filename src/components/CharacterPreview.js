// src/components/CharacterPreview.js
import React, { useState, useEffect, useRef } from 'react';

const CharacterPreview = ({
  uploadedImage,
  analysisResults,
  segmentedLayers,
  riggedModel,
  processing,
  error
}) => {
  const [currentAnimation, setCurrentAnimation] = useState(null);
  const [showLayers, setShowLayers] = useState(false);
  const [layerVisibility, setLayerVisibility] = useState({});
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Initialize layer visibility
  useEffect(() => {
    if (segmentedLayers) {
      const visibility = {};
      segmentedLayers.forEach(layer => {
        visibility[layer.id] = true;
      });
      setLayerVisibility(visibility);
    }
  }, [segmentedLayers]);

  // Simulate progress during processing
  useEffect(() => {
    if (processing) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return 95;
          return prev + Math.random() * 15;
        });
      }, 500);
      return () => clearInterval(interval);
    } else if (segmentedLayers) {
      setProgress(100);
    }
  }, [processing, segmentedLayers]);

  // Draw layers on canvas
  useEffect(() => {
    if (!canvasRef.current || !segmentedLayers || processing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    if (riggedModel?.dimensions) {
      canvas.width = Math.min(riggedModel.dimensions.width, 800);
      canvas.height = Math.min(riggedModel.dimensions.height, 800);
    }

    const drawFrame = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sort layers by zIndex
      const sortedLayers = [...segmentedLayers].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

      // Draw each visible layer
      sortedLayers.forEach(layer => {
        if (!layerVisibility[layer.id] || !layer.imageData) return;

        try {
          const img = new Image();
          img.onload = () => {
            ctx.save();
            
            // Apply animation transformations
            if (currentAnimation && riggedModel?.animations?.[currentAnimation]) {
              const anim = riggedModel.animations[currentAnimation];
              if (anim.layers && anim.layers.includes(layer.type)) {
                const now = Date.now();
                const time = (now % anim.duration) / anim.duration;
                
                // Find the appropriate keyframe
                let keyframe = anim.keyframes[0];
                for (let i = 0; i < anim.keyframes.length - 1; i++) {
                  if (time >= anim.keyframes[i].time && time <= anim.keyframes[i + 1].time) {
                    // Simple interpolation between keyframes
                    const t = (time - anim.keyframes[i].time) / (anim.keyframes[i + 1].time - anim.keyframes[i].time);
                    const k1 = anim.keyframes[i];
                    const k2 = anim.keyframes[i + 1];
                    
                    keyframe = {
                      scaleY: k1.scaleY !== undefined ? k1.scaleY + (k2.scaleY - k1.scaleY) * t : 1,
                      translateY: k1.translateY !== undefined ? k1.translateY + (k2.translateY - k1.translateY) * t : 0,
                      rotate: k1.rotate !== undefined ? k1.rotate + (k2.rotate - k1.rotate) * t : 0
                    };
                    break;
                  }
                }
                
                // Apply transformations
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                
                ctx.translate(centerX, centerY);
                
                if (keyframe.rotate !== undefined) {
                  ctx.rotate(keyframe.rotate * Math.PI / 180);
                }
                
                if (keyframe.scaleY !== undefined) {
                  ctx.scale(1, keyframe.scaleY);
                }
                
                if (keyframe.translateY !== undefined) {
                  ctx.translate(0, keyframe.translateY);
                }
                
                ctx.translate(-centerX, -centerY);
              }
            }

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            ctx.restore();
          };
          img.src = layer.imageData;
        } catch (err) {
          console.error(`Failed to draw layer ${layer.id}:`, err);
        }
      });

      // Continue animation loop if animating
      if (currentAnimation) {
        requestAnimationFrame(drawFrame);
      }
    };

    drawFrame();
  }, [segmentedLayers, layerVisibility, currentAnimation, riggedModel, processing]);

  // Play animation
  const playAnimation = (animName) => {
    setCurrentAnimation(animName);
    
    // Stop animation after duration
    if (riggedModel?.animations?.[animName]) {
      clearTimeout(animationRef.current);
      animationRef.current = setTimeout(() => {
        setCurrentAnimation(null);
      }, riggedModel.animations[animName].duration);
    }
  };

  // Toggle layer visibility
  const toggleLayer = (layerId) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layerId]: !prev[layerId]
    }));
  };

  // Processing view
  if (processing) {
    const messages = [
      { threshold: 0, text: "📸 Opening your beautiful image..." },
      { threshold: 20, text: "🎨 Analyzing colors and features..." },
      { threshold: 40, text: "🍰 Layering the cake..." },
      { threshold: 60, text: "👩‍🍳 Cooking up your model..." },
      { threshold: 80, text: "🦴 Adding the skeleton crew..." },
      { threshold: 95, text: "✨ Adding the final sparkles..." }
    ];

    const currentMessage = messages.filter(m => progress >= m.threshold).pop() || messages[0];

    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="text-2xl mb-4">{currentMessage.text}</div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-sm text-gray-600">{Math.floor(progress)}%</div>
        </div>
      </div>
    );
  }

  // Error view
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-red-600">❌ {error}</div>
      </div>
    );
  }

  // No data view
  if (!segmentedLayers || !riggedModel) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8">
        <div className="text-center text-gray-500">
          No character data available
        </div>
      </div>
    );
  }

  // Main preview view
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas Preview */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Character Preview</h3>
          <div className="bg-gray-100 rounded-lg p-4 flex justify-center items-center" style={{ minHeight: '400px' }}>
            <canvas 
              ref={canvasRef}
              className="max-w-full h-auto border border-gray-300 rounded"
              style={{ maxHeight: '500px' }}
            />
          </div>

          {/* Animation Controls */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Animations:</h4>
            <div className="flex flex-wrap gap-2">
              {riggedModel?.animations && Object.keys(riggedModel.animations).map(animName => (
                <button
                  key={animName}
                  onClick={() => playAnimation(animName)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    currentAnimation === animName 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {animName === 'blink' && '😉 '}
                  {animName === 'smile' && '😊 '}
                  {animName === 'headTurn' && '🔄 '}
                  {animName === 'wave' && '👋 '}
                  {animName === 'idle' && '💤 '}
                  {animName.charAt(0).toUpperCase() + animName.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Layer Controls */}
        <div className="lg:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Layers</h3>
            <button
              onClick={() => setShowLayers(!showLayers)}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              {showLayers ? 'Hide' : 'Show'}
            </button>
          </div>

          {showLayers && segmentedLayers && (
            <div className="space-y-2">
              {segmentedLayers.map(layer => (
                <div 
                  key={layer.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={layerVisibility[layer.id] !== false}
                      onChange={() => toggleLayer(layer.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">
                      {layer.type ? 
                        layer.type.replace(/_/g, ' ').charAt(0).toUpperCase() + 
                        layer.type.replace(/_/g, ' ').slice(1) : 
                        `Layer ${layer.id}`
                      }
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    z: {layer.zIndex !== undefined ? layer.zIndex : 0}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Model Stats</h4>
            <div className="space-y-1 text-xs text-blue-700">
              <div>📐 Layers: {segmentedLayers.length}</div>
              <div>🦴 Bones: {riggedModel.bones?.length || 0}</div>
              <div>🎬 Animations: {Object.keys(riggedModel.animations || {}).length}</div>
              <div>📏 Size: {riggedModel.dimensions?.width} × {riggedModel.dimensions?.height}px</div>
            </div>
          </div>

          {/* Export Button */}
          <button 
            onClick={() => {
              // Export functionality
              const exportData = {
                layers: segmentedLayers,
                animations: riggedModel.animations,
                dimensions: riggedModel.dimensions,
                metadata: {
                  exportDate: new Date().toISOString(),
                  layerCount: segmentedLayers.length,
                  animationCount: Object.keys(riggedModel.animations || {}).length
                }
              };
              
              // Download as JSON
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'character-model.json';
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="w-full mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            📦 Export Model
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterPreview;
