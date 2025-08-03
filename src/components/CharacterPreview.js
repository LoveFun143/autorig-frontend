// src/components/CharacterPreview.js
import React from 'react';

class CharacterPreview extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.animationRef = null;
    this.layerImages = {};
    
    this.state = {
      isLoaded: false,
      currentAnimation: 'idle',
      animationTime: 0,
      layerSettings: {},
      previewSize: { width: 400, height: 600 },
      // Cute processing states
      processingStep: 'idle',
      processingMessage: '',
      processingProgress: 0
    };
  }

  async componentDidMount() {
    await this.initializePreview();
  }

  async componentDidUpdate(prevProps) {
    if (prevProps.segmentedLayers !== this.props.segmentedLayers || 
        prevProps.originalImage !== this.props.originalImage) {
      await this.initializePreview();
    }
  }

  getCuteProcessingMessage(step, progress) {
    const messages = {
      'loading_image': [
        '📸 Opening your beautiful image...',
        '🎨 Admiring your artwork...',
        '✨ Getting ready to work some magic...'
      ],
      'generating_layers': [
        '🍰 Layering the cake...',
        '🧅 Peeling back the layers...',
        '📚 Organizing your character like a library...',
        '🎭 Separating the cast of characters...',
        '🔍 Finding all the hidden details...'
      ],
      'cooking_model': [
        '👩‍🍳 Cooking up your model...',
        '🧪 Mixing the perfect recipe...',
        '⚗️ Brewing some character magic...',
        '🔥 Heating up the animation oven...',
        '🎪 Setting up the puppet strings...'
      ],
      'adding_bones': [
        '🦴 Adding the skeleton crew...',
        '🤖 Installing the puppet strings...',
        '🕴️ Teaching your character to dance...',
        '🎯 Connecting all the moving parts...'
      ],
      'final_touches': [
        '✨ Adding the final sparkles...',
        '💄 Applying the finishing touches...',
        '🎀 Tying it all together with a bow...',
        '🌟 Polishing until it shines...'
      ],
      'ready': [
        '🎉 Ta-da! Your character is ready!',
        '✅ All done! Looking absolutely fantastic!',
        '🚀 Ready for takeoff!',
        '🎭 Your star is ready for the stage!'
      ]
    };
    
    const stepMessages = messages[step] || ['Working on something amazing...'];
    const messageIndex = Math.floor(progress / 20) % stepMessages.length;
    return stepMessages[messageIndex];
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async initializePreview() {
    console.log('🎨 Initializing character preview...');
    
    if (!this.props.originalImage || !this.props.segmentedLayers) return;
    
    try {
      // Step 1: Loading image
      this.setState({ 
        processingStep: 'loading_image', 
        processingProgress: 10,
        processingMessage: this.getCuteProcessingMessage('loading_image', 10)
      });
      
      const originalImg = await this.loadImage(this.props.originalImage);
      await this.delay(800);
      
      // Step 2: Generating layers
      this.setState({ 
        processingStep: 'generating_layers', 
        processingProgress: 30,
        processingMessage: this.getCuteProcessingMessage('generating_layers', 30)
      });
      
      await this.generateLayerImages(originalImg);
      
      // Step 3: Cooking the model
      this.setState({ 
        processingStep: 'cooking_model', 
        processingProgress: 60,
        processingMessage: this.getCuteProcessingMessage('cooking_model', 60)
      });
      
      this.initializeLayerSettings();
      await this.delay(600);
      
      // Step 4: Adding bones
      this.setState({ 
        processingStep: 'adding_bones', 
        processingProgress: 80,
        processingMessage: this.getCuteProcessingMessage('adding_bones', 80)
      });
      
      await this.delay(500);
      
      // Step 5: Final touches
      this.setState({ 
        processingStep: 'final_touches', 
        processingProgress: 95,
        processingMessage: this.getCuteProcessingMessage('final_touches', 95)
      });
      
      await this.delay(400);
      
      // Step 6: Ready!
      this.setState({ 
        processingStep: 'ready', 
        processingProgress: 100,
        processingMessage: this.getCuteProcessingMessage('ready', 100)
      });
      
      await this.delay(300);
      
      // Start animation loop
      this.startAnimationLoop();
      
      this.setState({ isLoaded: true });
      console.log('✅ Character preview initialized');
      
    } catch (error) {
      console.error('❌ Preview initialization failed:', error);
      this.setState({
        processingMessage: '😅 Oops! Something went wrong, but we\'ll keep trying!',
        processingStep: 'error'
      });
    }
  }

  async loadImage(imageFile) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(imageFile);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  async generateLayerImages(originalImg) {
    console.log('🖼️ Generating preview layer images...');
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = originalImg.width;
    canvas.height = originalImg.height;
    
    const totalLayers = this.props.segmentedLayers.length;
    
    // Generate each layer with cute progress updates
    for (let i = 0; i < totalLayers; i++) {
      const layer = this.props.segmentedLayers[i];
      
      // Update progress with cute messages
      const progress = 30 + (i / totalLayers) * 30; // 30-60% range
      this.setState({
        processingProgress: progress,
        processingMessage: `🍰 Layering ${layer.name}... (${i + 1}/${totalLayers})`
      });
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw original image
      ctx.drawImage(originalImg, 0, 0);
      
      // Apply layer mask
      await this.applyLayerMask(ctx, layer, i, canvas.width, canvas.height);
      
      // Convert to image
      const layerImg = new Image();
      layerImg.src = canvas.toDataURL('image/png');
      
      await new Promise(resolve => {
        layerImg.onload = resolve;
      });
      
      this.layerImages[layer.name] = layerImg;
      console.log(`✅ Generated layer: ${layer.name}`);
      
      // Small delay to show progress
      await this.delay(200);
    }
  }

  async applyLayerMask(ctx, layer, layerIndex, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    
    // Apply different masks based on layer type
    if (layer.name === 'background') {
      this.createBackgroundMask(pixels, width, height);
    } else if (layer.name.includes('face') || layer.name.includes('eye') || layer.name.includes('mouth')) {
      this.createFacialMask(pixels, width, height, layer.name);
    } else if (layer.name.includes('hair')) {
      this.createHairMask(pixels, width, height);
    } else if (layer.name.includes('body') || layer.name.includes('arm') || layer.name.includes('leg')) {
      this.createBodyMask(pixels, width, height, layer.name);
    } else if (layer.name.includes('clothing') || layer.name.includes('shirt') || layer.name.includes('pants')) {
      this.createClothingMask(pixels, width, height);
    } else if (layer.name.includes('cat') || layer.name.includes('ear')) {
      this.createEarMask(pixels, width, height);
    } else {
      this.createGenericMask(pixels, width, height, layerIndex);
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  createBackgroundMask(pixels, width, height) {
    for (let i = 0; i < pixels.length; i += 4) {
      const x = ((i / 4) % width);
      const y = Math.floor((i / 4) / width);
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      const brightness = (r + g + b) / 3;
      const isEdge = x < 20 || x > width - 20 || y < 20 || y > height - 20;
      const isBackground = isEdge || brightness > 180;
      
      if (!isBackground) {
        pixels[i + 3] = 0;
      }
    }
  }

  createFacialMask(pixels, width, height, layerName) {
    const faceRegion = {
      x: width * 0.25,
      y: height * 0.15,
      width: width * 0.5,
      height: height * 0.4
    };
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        const inFaceRegion = (
          x >= faceRegion.x && x <= faceRegion.x + faceRegion.width &&
          y >= faceRegion.y && y <= faceRegion.y + faceRegion.height
        );
        
        if (!inFaceRegion) {
          pixels[i + 3] = 0;
        } else if (layerName.includes('eye')) {
          const eyeY = faceRegion.y + faceRegion.height * 0.3;
          const isEyeHeight = Math.abs(y - eyeY) < faceRegion.height * 0.2;
          const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
          
          if (!isEyeHeight || brightness > 120) {
            pixels[i + 3] = Math.floor(pixels[i + 3] * 0.3);
          }
        } else if (layerName.includes('mouth')) {
          const mouthY = faceRegion.y + faceRegion.height * 0.7;
          const isMouthHeight = Math.abs(y - mouthY) < faceRegion.height * 0.15;
          
          if (!isMouthHeight) {
            pixels[i + 3] = Math.floor(pixels[i + 3] * 0.2);
          }
        }
      }
    }
  }

  createHairMask(pixels, width, height) {
    const hairRegion = {
      x: width * 0.1,
      y: 0,
      width: width * 0.8,
      height: height * 0.6
    };
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        const inHairRegion = (
          x >= hairRegion.x && x <= hairRegion.x + hairRegion.width &&
          y >= hairRegion.y && y <= hairRegion.y + hairRegion.height
        );
        
        if (!inHairRegion) {
          pixels[i + 3] = 0;
        } else {
          const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
          const isLikelyHair = brightness < 150 && y < height * 0.4;
          
          if (!isLikelyHair) {
            pixels[i + 3] = Math.floor(pixels[i + 3] * 0.4);
          }
        }
      }
    }
  }

  createBodyMask(pixels, width, height, layerName) {
    let bodyRegion;
    
    if (layerName.includes('arm')) {
      bodyRegion = layerName.includes('left') ? 
        { x: 0, y: height * 0.3, width: width * 0.4, height: height * 0.4 } :
        { x: width * 0.6, y: height * 0.3, width: width * 0.4, height: height * 0.4 };
    } else if (layerName.includes('leg')) {
      bodyRegion = layerName.includes('left') ?
        { x: width * 0.3, y: height * 0.6, width: width * 0.2, height: height * 0.4 } :
        { x: width * 0.5, y: height * 0.6, width: width * 0.2, height: height * 0.4 };
    } else {
      bodyRegion = { x: width * 0.2, y: height * 0.3, width: width * 0.6, height: height * 0.4 };
    }
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        const inBodyRegion = (
          x >= bodyRegion.x && x <= bodyRegion.x + bodyRegion.width &&
          y >= bodyRegion.y && y <= bodyRegion.y + bodyRegion.height
        );
        
        if (!inBodyRegion) {
          pixels[i + 3] = 0;
        }
      }
    }
  }

  createClothingMask(pixels, width, height) {
    const clothingRegion = { x: width * 0.15, y: height * 0.25, width: width * 0.7, height: width * 0.5 };
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        const inClothingRegion = (
          x >= clothingRegion.x && x <= clothingRegion.x + clothingRegion.width &&
          y >= clothingRegion.y && y <= clothingRegion.y + clothingRegion.height
        );
        
        if (!inClothingRegion) {
          pixels[i + 3] = 0;
        }
      }
    }
  }

  createEarMask(pixels, width, height) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        const isLeftEar = (x < width * 0.4 && y < height * 0.3);
        const isRightEar = (x > width * 0.6 && y < height * 0.3);
        const isEarRegion = isLeftEar || isRightEar;
        
        if (!isEarRegion) {
          pixels[i + 3] = 0;
        } else {
          const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
          if (brightness > 150) {
            pixels[i + 3] = Math.floor(pixels[i + 3] * 0.6);
          }
        }
      }
    }
  }

  createGenericMask(pixels, width, height, layerIndex) {
    const totalLayers = this.props.segmentedLayers.length;
    const regionHeight = height / Math.ceil(totalLayers / 2);
    const regionWidth = width / 2;
    
    const row = Math.floor(layerIndex / 2);
    const col = layerIndex % 2;
    
    const region = {
      x: col * regionWidth,
      y: row * regionHeight,
      width: regionWidth,
      height: regionHeight
    };
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        const inRegion = (
          x >= region.x && x <= region.x + region.width &&
          y >= region.y && y <= region.y + region.height
        );
        
        if (!inRegion) {
          pixels[i + 3] = 0;
        }
      }
    }
  }

  initializeLayerSettings() {
    const layerSettings = {};
    
    this.props.segmentedLayers.forEach((layer, index) => {
      layerSettings[layer.name] = {
        visible: true,
        opacity: layer.confidence || 1.0,
        x: 0,
        y: 0,
        scale: 1.0,
        rotation: 0,
        zIndex: index
      };
    });
    
    this.setState({ layerSettings });
  }

  startAnimationLoop() {
    const animate = (timestamp) => {
      this.setState({ animationTime: timestamp * 0.001 });
      this.renderCharacter();
      this.animationRef = requestAnimationFrame(animate);
    };
    
    this.animationRef = requestAnimationFrame(animate);
  }

  componentWillUnmount() {
    if (this.animationRef) {
      cancelAnimationFrame(this.animationRef);
    }
  }

  renderCharacter() {
    const canvas = this.canvasRef.current;
    if (!canvas || !this.state.isLoaded) return;
    
    const ctx = canvas.getContext('2d');
    const { previewSize, layerSettings, currentAnimation, animationTime } = this.state;
    
    // Clear canvas
    ctx.clearRect(0, 0, previewSize.width, previewSize.height);
    
    // Sort layers by z-index
    const sortedLayers = this.props.segmentedLayers
      .map(layer => ({ ...layer, settings: layerSettings[layer.name] }))
      .filter(layer => layer.settings && layer.settings.visible)
      .sort((a, b) => a.settings.zIndex - b.settings.zIndex);
    
    // Render each layer
    sortedLayers.forEach(layer => {
      const layerImg = this.layerImages[layer.name];
      if (!layerImg) return;
      
      const settings = layer.settings;
      const animationTransform = this.getAnimationTransform(layer.name, currentAnimation, animationTime);
      
      ctx.save();
      
      // Apply transformations
      ctx.globalAlpha = settings.opacity * animationTransform.opacity;
      ctx.translate(
        previewSize.width / 2 + settings.x + animationTransform.x,
        previewSize.height / 2 + settings.y + animationTransform.y
      );
      ctx.scale(settings.scale * animationTransform.scale, settings.scale * animationTransform.scale);
      ctx.rotate((settings.rotation + animationTransform.rotation) * Math.PI / 180);
      
      // Draw layer
      ctx.drawImage(
        layerImg,
        -layerImg.width / 2,
        -layerImg.height / 2,
        layerImg.width,
        layerImg.height
      );
      
      ctx.restore();
    });
  }

  getAnimationTransform(layerName, animation, time) {
    const transform = { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 };
    
    if (animation === 'blink' && (layerName.includes('eye') || layerName.includes('eyelid'))) {
      const blinkCycle = (time % 2) / 2;
      if (blinkCycle > 0.1 && blinkCycle < 0.3) {
        transform.scale = 1 - Math.sin((blinkCycle - 0.1) * Math.PI / 0.2) * 0.8;
      }
    } else if (animation === 'smile' && layerName.includes('mouth')) {
      const smileCycle = (Math.sin(time * 0.5) + 1) / 2;
      transform.y = -smileCycle * 3;
      transform.scale = 1 + smileCycle * 0.1;
    } else if (animation === 'head_turn') {
      const turnCycle = Math.sin(time * 0.3);
      if (layerName.includes('face') || layerName.includes('hair') || layerName.includes('head')) {
        transform.rotation = turnCycle * 10;
        transform.x = turnCycle * 5;
      }
    } else if (animation === 'wave' && layerName.includes('arm')) {
      const waveCycle = Math.sin(time * 2);
      if (layerName.includes('right')) {
        transform.rotation = waveCycle * 30;
        transform.y = -Math.abs(waveCycle) * 10;
      }
    } else if (animation === 'ear_twitch' && layerName.includes('ear')) {
      const twitchCycle = Math.sin(time * 3);
      transform.rotation = twitchCycle * 15;
      transform.scale = 1 + Math.abs(twitchCycle) * 0.1;
    }
    
    return transform;
  }

  updateLayerSetting = (layerName, property, value) => {
    this.setState(prevState => ({
      layerSettings: {
        ...prevState.layerSettings,
        [layerName]: {
          ...prevState.layerSettings[layerName],
          [property]: value
        }
      }
    }));
  };

  playAnimation = (animationName) => {
    this.setState({ currentAnimation: animationName });
    console.log(`🎬 Playing animation: ${animationName}`);
  };

  render() {
    const { segmentedLayers, riggedModel } = this.props;
    const { isLoaded, layerSettings, currentAnimation, processingStep, processingMessage, processingProgress } = this.state;
    
    if (!segmentedLayers || !riggedModel) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Upload and process an image to see character preview</p>
        </div>
      );
    }
    
    // Show cute loading screen while processing
    if (!isLoaded) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '15px',
          margin: '20px 0',
          border: '2px dashed #007bff'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '10px'
            }}>
              {processingStep === 'loading_image' && '📸'}
              {processingStep === 'generating_layers' && '🍰'}
              {processingStep === 'cooking_model' && '👩‍🍳'}
              {processingStep === 'adding_bones' && '🦴'}
              {processingStep === 'final_touches' && '✨'}
              {processingStep === 'ready' && '🎉'}
              {processingStep === 'error' && '😅'}
            </div>
            
            <h3 style={{ color: '#007bff', marginBottom: '15px' }}>
              {processingMessage}
            </h3>
            
            {/* Progress bar */}
            <div style={{
              width: '300px',
              height: '20px',
              backgroundColor: '#e9ecef',
              borderRadius: '10px',
              margin: '0 auto',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                width: `${processingProgress}%`,
                height: '100%',
                background: 'linear-gradient(45deg, #007bff, #28a745)',
                borderRadius: '10px',
                transition: 'width 0.3s ease',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {Math.round(processingProgress)}%
                </div>
              </div>
            </div>
            
            {processingStep !== 'ready' && (
              <p style={{ 
                marginTop: '15px', 
                color: '#6c757d',
                fontSize: '14px'
              }}>
                ✨ Creating {segmentedLayers.length} layers with {riggedModel.bones?.length || 0} bones and {riggedModel.animations?.length || 0} animations...
              </p>
            )}
          </div>
        </div>
      );
    }

    // Show the actual preview
    return (
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px',
        margin: '20px 0',
        position: 'relative'
      }}>
        {/* Success message */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: '#28a745',
          color: 'white',
          padding: '8px 15px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          🎉 Character Ready!
        </div>
        
        {/* Preview Canvas */}
        <div style={{ flex: '1' }}>
          <h3>🎨 Character Preview</h3>
          <div style={{ 
            border: '2px solid #ddd', 
            borderRadius: '8px', 
            backgroundColor: '#fff',
            padding: '10px',
            textAlign: 'center'
          }}>
            <canvas
              ref={this.canvasRef}
              width={400}
              height={600}
              style={{ 
                maxWidth: '100%', 
                height: 'auto',
                border: '1px solid #eee'
              }}
            />
          </div>
          
          {/* Animation Controls */}
          <div style={{ marginTop: '15px' }}>
            <h4>🎬 Animations</h4>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {riggedModel.animations.map(animation => (
                <button
                  key={animation}
                  onClick={() => this.playAnimation(animation)}
                  style={{
                    padding: '8px 15px',
                    backgroundColor: currentAnimation === animation ? '#007bff' : '#fff',
                    color: currentAnimation === animation ? '#fff' : '#333',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {animation}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Layer Editor */}
        <div style={{ flex: '1' }}>
          <h3>⚙️ Layer Editor</h3>
          <div style={{ 
            maxHeight: '500px', 
            overflowY: 'auto',
            border: '1px solid #ddd',
            borderRadius: '5px',
            padding: '10px',
            backgroundColor: '#fff'
          }}>
            {segmentedLayers.map((layer, index) => {
              const settings = layerSettings[layer.name] || {};
              return (
                <div key={layer.name} style={{ 
                  marginBottom: '15px', 
                  padding: '10px',
                  border: '1px solid #eee',
                  borderRadius: '5px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <strong>{layer.name}</strong>
                    <label>
                      <input
                        type="checkbox"
                        checked={settings.visible || false}
                        onChange={(e) => this.updateLayerSetting(layer.name, 'visible', e.target.checked)}
                      />
                      Visible
                    </label>
                  </div>
                  
                  {settings.visible && (
                    <div>
                      <div style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '2px' }}>
                          Opacity: {Math.round((settings.opacity || 1) * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={settings.opacity || 1}
                          onChange={(e) => this.updateLayerSetting(layer.name, 'opacity', parseFloat(e.target.value))}
                          style={{ width: '100%' }}
                        />
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px' }}>X Position</label>
                          <input
                            type="range"
                            min="-50"
                            max="50"
                            value={settings.x || 0}
                            onChange={(e) => this.updateLayerSetting(layer.name, 'x', parseInt(e.target.value))}
                                   style={{ width: '100%' }}
                         />
                       </div>
                       
                       <div>
                         <label style={{ display: 'block', fontSize: '12px' }}>Y Position</label>
                         <input
                           type="range"
                           min="-50"
                           max="50"
                           value={settings.y || 0}
                           onChange={(e) => this.updateLayerSetting(layer.name, 'y', parseInt(e.target.value))}
                           style={{ width: '100%' }}
                         />
                       </div>
                     </div>
                   </div>
                 )}
               </div>
             );
           })}
         </div>
       </div>
     </div>
   );
 }
}

export default CharacterPreview;
