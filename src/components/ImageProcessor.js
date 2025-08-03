// src/components/ImageProcessor.js
class ImageProcessor {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  async processImage(imageUrl, layers) {
    console.log('🎨 Starting image processing...');
    
    // Load the image
    const img = await this.loadImage(imageUrl);
    this.canvas.width = img.width;
    this.canvas.height = img.height;
    
    // Process each layer
    const processedLayers = [];
    
    for (const layer of layers) {
      console.log(`🔧 Processing layer: ${layer.type}`);
      
      const layerData = await this.createLayer(img, layer);
      processedLayers.push({
        ...layer,
        imageData: layerData.url,
        canvas: layerData.canvas,
        width: img.width,
        height: img.height
      });
    }
    
    // Create animation data
    const animations = this.createAnimations(processedLayers);
    
    console.log('✅ Image processing complete!');
    
    return {
      layers: processedLayers,
      animations: animations,
      dimensions: {
        width: img.width,
        height: img.height
      }
    };
  }

  async loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async createLayer(img, layerInfo) {
    const layerCanvas = document.createElement('canvas');
    layerCanvas.width = img.width;
    layerCanvas.height = img.height;
    const layerCtx = layerCanvas.getContext('2d');
    
    // Clear the canvas
    layerCtx.clearRect(0, 0, img.width, img.height);
    
    // Different processing based on layer type
    switch (layerInfo.type) {
      case 'background':
        // Full image as background
        layerCtx.drawImage(img, 0, 0);
        this.applyBlur(layerCtx, img.width, img.height, 3);
        break;
        
      case 'body':
        // Main body area (middle section)
        layerCtx.drawImage(img, 0, 0);
        this.maskRegion(layerCtx, img.width, img.height, 'body');
        break;
        
      case 'head':
        // Head area (top section)
        layerCtx.drawImage(img, 0, 0);
        this.maskRegion(layerCtx, img.width, img.height, 'head');
        break;
        
      case 'face':
        // Face area (center of head)
        layerCtx.drawImage(img, 0, 0);
        this.maskRegion(layerCtx, img.width, img.height, 'face');
        break;
        
      case 'eyes':
        // Eyes area
        layerCtx.drawImage(img, 0, 0);
        this.maskRegion(layerCtx, img.width, img.height, 'eyes');
        break;
        
      case 'mouth':
        // Mouth area
        layerCtx.drawImage(img, 0, 0);
        this.maskRegion(layerCtx, img.width, img.height, 'mouth');
        break;
        
      case 'hair_front':
        // Front hair layer
        layerCtx.drawImage(img, 0, 0);
        this.maskRegion(layerCtx, img.width, img.height, 'hair_front');
        break;
        
      case 'accessories':
        // Any accessories
        layerCtx.drawImage(img, 0, 0);
        this.maskRegion(layerCtx, img.width, img.height, 'accessories');
        break;
        
      default:
        // Default: use full image
        layerCtx.drawImage(img, 0, 0);
    }
    
    return {
      canvas: layerCanvas,
      url: layerCanvas.toDataURL('image/png')
    };
  }

  maskRegion(ctx, width, height, region) {
    // Create masks for different regions
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Define regions as percentages of image dimensions
    const regions = {
      body: { top: 0.4, bottom: 1, left: 0.2, right: 0.8 },
      head: { top: 0, bottom: 0.4, left: 0.25, right: 0.75 },
      face: { top: 0.15, bottom: 0.35, left: 0.35, right: 0.65 },
      eyes: { top: 0.18, bottom: 0.25, left: 0.35, right: 0.65 },
      mouth: { top: 0.28, bottom: 0.32, left: 0.4, right: 0.6 },
      hair_front: { top: 0, bottom: 0.25, left: 0.25, right: 0.75 },
      accessories: { top: 0, bottom: 0.15, left: 0.3, right: 0.7 }
    };
    
    const r = regions[region] || { top: 0, bottom: 1, left: 0, right: 1 };
    
    // Apply mask with soft edges
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        const normalizedX = x / width;
        const normalizedY = y / height;
        
        // Check if pixel is outside the region
        if (normalizedX < r.left || normalizedX > r.right ||
            normalizedY < r.top || normalizedY > r.bottom) {
          // Make transparent
          data[idx + 3] = 0;
        } else {
          // Soft edge fade
          const fadeDistance = 0.05;
          let alpha = 1;
          
          // Calculate distance from edges
          const distFromLeft = (normalizedX - r.left) / fadeDistance;
          const distFromRight = (r.right - normalizedX) / fadeDistance;
          const distFromTop = (normalizedY - r.top) / fadeDistance;
          const distFromBottom = (r.bottom - normalizedY) / fadeDistance;
          
          // Apply fade
          alpha = Math.min(alpha, distFromLeft, distFromRight, distFromTop, distFromBottom);
          alpha = Math.max(0, Math.min(1, alpha));
          
          data[idx + 3] = Math.floor(data[idx + 3] * alpha);
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  applyBlur(ctx, width, height, radius) {
    // Simple box blur
    ctx.filter = `blur(${radius}px)`;
    const imageData = ctx.getImageData(0, 0, width, height);
    ctx.putImageData(imageData, 0, 0);
  }

  createAnimations(layers) {
    // Define animation keyframes for different layer types
    return {
      blink: {
        layers: ['eyes'],
        keyframes: [
          { time: 0, scaleY: 1 },
          { time: 0.1, scaleY: 0.1 },
          { time: 0.2, scaleY: 1 }
        ],
        duration: 200
      },
      smile: {
        layers: ['mouth'],
        keyframes: [
          { time: 0, scaleY: 1, translateY: 0 },
          { time: 0.5, scaleY: 1.2, translateY: -2 },
          { time: 1, scaleY: 1, translateY: 0 }
        ],
        duration: 500
      },
      headTurn: {
        layers: ['head', 'face', 'eyes', 'mouth', 'hair_front'],
        keyframes: [
          { time: 0, rotateY: 0 },
          { time: 0.5, rotateY: 15 },
          { time: 1, rotateY: 0 }
        ],
        duration: 1000
      },
      wave: {
        layers: ['body'],
        keyframes: [
          { time: 0, rotate: 0 },
          { time: 0.25, rotate: -5 },
          { time: 0.75, rotate: 5 },
          { time: 1, rotate: 0 }
        ],
        duration: 800
      },
      idle: {
        layers: ['body', 'head'],
        keyframes: [
          { time: 0, translateY: 0 },
          { time: 0.5, translateY: -3 },
          { time: 1, translateY: 0 }
        ],
        duration: 2000
      }
    };
  }
}

export default ImageProcessor;
