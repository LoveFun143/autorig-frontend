// src/components/ImageProcessor.js
class ImageProcessor {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  async processImage(imageUrl, layers) {
    console.log('🎨 Starting advanced image segmentation...');
    
    // Load the image
    const img = await this.loadImage(imageUrl);
    this.canvas.width = img.width;
    this.canvas.height = img.height;
    
    // First, extract the character from background
    const characterData = await this.extractCharacter(img);
    
    // Process each layer with actual segmentation
    const processedLayers = [];
    
    for (const layer of layers) {
      console.log(`🔧 Segmenting layer: ${layer.type}`);
      
      const layerData = await this.segmentLayer(img, layer.type, characterData);
      processedLayers.push({
        ...layer,
        imageData: layerData.url,
        canvas: layerData.canvas,
        width: img.width,
        height: img.height,
        hasContent: layerData.hasContent
      });
      
      console.log(`✅ Layer ${layer.type} segmented: ${layerData.hasContent ? 'has content' : 'empty'}`);
    }
    
    // Create animation data
    const animations = this.createAnimations(processedLayers);
    
    console.log('✅ Image segmentation complete!');
    console.log(`📊 Created ${processedLayers.filter(l => l.hasContent).length} layers with content`);
    
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

  async extractCharacter(img) {
    // Extract character from background using edge detection and color analysis
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Simple background removal based on corners
    const bgColors = this.getBackgroundColors(data, canvas.width, canvas.height);
    
    // Create mask for character
    const mask = new Uint8ClampedArray(canvas.width * canvas.height);
    
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Check if pixel is similar to background
      let isBackground = false;
      for (const bgColor of bgColors) {
        const diff = Math.abs(r - bgColor.r) + Math.abs(g - bgColor.g) + Math.abs(b - bgColor.b);
        if (diff < 60) { // Threshold for background similarity
          isBackground = true;
          break;
        }
      }
      
      mask[pixelIndex] = isBackground ? 0 : 255;
    }
    
    // Apply morphological operations to clean up the mask
    this.cleanMask(mask, canvas.width, canvas.height);
    
    return {
      mask: mask,
      bounds: this.findBounds(mask, canvas.width, canvas.height)
    };
  }

  getBackgroundColors(data, width, height) {
    const colors = [];
    const sampleSize = 10;
    
    // Sample corners
    const corners = [
      { x: 0, y: 0 }, // Top-left
      { x: width - 1, y: 0 }, // Top-right
      { x: 0, y: height - 1 }, // Bottom-left
      { x: width - 1, y: height - 1 } // Bottom-right
    ];
    
    for (const corner of corners) {
      let r = 0, g = 0, b = 0, count = 0;
      
      for (let dx = 0; dx < sampleSize && corner.x + dx < width; dx++) {
        for (let dy = 0; dy < sampleSize && corner.y + dy < height; dy++) {
          const idx = ((corner.y + dy) * width + (corner.x + dx)) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          count++;
        }
      }
      
      colors.push({
        r: Math.round(r / count),
        g: Math.round(g / count),
        b: Math.round(b / count)
      });
    }
    
    return colors;
  }

  cleanMask(mask, width, height) {
    // Simple erosion and dilation to clean up the mask
    const temp = new Uint8ClampedArray(mask);
    
    // Erosion
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (mask[idx] === 255) {
          // Check neighbors
          let neighbors = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (mask[(y + dy) * width + (x + dx)] === 255) {
                neighbors++;
              }
            }
          }
          if (neighbors < 5) {
            temp[idx] = 0;
          }
        }
      }
    }
    
    // Copy back
    for (let i = 0; i < mask.length; i++) {
      mask[i] = temp[i];
    }
  }

  findBounds(mask, width, height) {
    let minX = width, maxX = 0, minY = height, maxY = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (mask[y * width + x] === 255) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  async segmentLayer(img, layerType, characterData) {
    const layerCanvas = document.createElement('canvas');
    layerCanvas.width = img.width;
    layerCanvas.height = img.height;
    const layerCtx = layerCanvas.getContext('2d');
    
    // Clear the canvas (transparent background)
    layerCtx.clearRect(0, 0, img.width, img.height);
    
    // Draw the original image
    layerCtx.drawImage(img, 0, 0);
    
    // Get image data
    const imageData = layerCtx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;
    
    // Define regions based on character bounds and typical proportions
    const bounds = characterData.bounds;
    const regions = this.calculateRegions(bounds, layerType);
    
    // Create a mask for this specific layer
    let hasContent = false;
    
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        const idx = (y * img.width + x) * 4;
        
        // Check if pixel is within character mask
        const maskIdx = y * img.width + x;
        if (characterData.mask[maskIdx] === 0) {
          // Outside character, make transparent
          data[idx + 3] = 0;
          continue;
        }
        
        // Check if pixel is within this layer's region
        if (!this.isInRegion(x, y, regions)) {
          // Outside this layer's region, make transparent
          data[idx + 3] = 0;
        } else {
          // This layer has content
          hasContent = true;
          
          // Apply soft edge fade for smoother transitions
          const fade = this.calculateEdgeFade(x, y, regions);
          data[idx + 3] = Math.floor(data[idx + 3] * fade);
        }
      }
    }
    
    // Put the modified image data back
    layerCtx.putImageData(imageData, 0, 0);
    
    // Generate PNG data URL
    const url = layerCanvas.toDataURL('image/png');
    
    return {
      canvas: layerCanvas,
      url: url,
      hasContent: hasContent
    };
  }

  calculateRegions(bounds, layerType) {
    // Calculate regions based on typical character proportions
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    const w = bounds.width;
    const h = bounds.height;
    
    const regions = {
      background: {
        x: 0, y: 0, width: 9999, height: 9999, exclude: true
      },
      body: {
        x: bounds.x + w * 0.2,
        y: bounds.y + h * 0.35,
        width: w * 0.6,
        height: h * 0.65
      },
      head: {
        x: bounds.x + w * 0.15,
        y: bounds.y,
        width: w * 0.7,
        height: h * 0.4
      },
      face: {
        x: bounds.x + w * 0.25,
        y: bounds.y + h * 0.1,
        width: w * 0.5,
        height: h * 0.25
      },
      eyes: {
        x: bounds.x + w * 0.3,
        y: bounds.y + h * 0.12,
        width: w * 0.4,
        height: h * 0.08
      },
      mouth: {
        x: bounds.x + w * 0.35,
        y: bounds.y + h * 0.22,
        width: w * 0.3,
        height: h * 0.06
      },
      hair_front: {
        x: bounds.x + w * 0.1,
        y: bounds.y,
        width: w * 0.8,
        height: h * 0.25
      },
      hair_back: {
        x: bounds.x + w * 0.05,
        y: bounds.y,
        width: w * 0.9,
        height: h * 0.3
      },
      accessories: {
        x: bounds.x,
        y: bounds.y,
        width: w,
        height: h * 0.15
      }
    };
    
    return regions[layerType] || regions.body;
  }

  isInRegion(x, y, region) {
    if (region.exclude) {
      return false;
    }
    
    return x >= region.x && 
           x <= region.x + region.width &&
           y >= region.y && 
           y <= region.y + region.height;
  }

  calculateEdgeFade(x, y, region) {
    if (region.exclude) return 0;
    
    const fadeDistance = 10; // Pixels to fade
    
    // Calculate distance from edges
    const distFromLeft = x - region.x;
    const distFromRight = (region.x + region.width) - x;
    const distFromTop = y - region.y;
    const distFromBottom = (region.y + region.height) - y;
    
    // Find minimum distance to any edge
    const minDist = Math.min(distFromLeft, distFromRight, distFromTop, distFromBottom);
    
    if (minDist >= fadeDistance) {
      return 1; // Fully opaque
    } else if (minDist <= 0) {
      return 0; // Fully transparent
    } else {
      // Smooth fade
      return minDist / fadeDistance;
    }
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
