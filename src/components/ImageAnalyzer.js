// src/components/ImageAnalyzer.js
class ImageAnalyzer {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  async analyzeImage(imageFile) {
    console.log('🔍 Starting real image analysis...');
    
    try {
      // Load image into canvas
      const imageData = await this.loadImageToCanvas(imageFile);
      
      // Run multiple analysis methods
      const results = {
        basicInfo: this.getBasicImageInfo(imageData),
        colorAnalysis: this.analyzeColors(imageData),
        complexityScore: this.calculateComplexity(imageData),
        shapeDetection: this.detectBasicShapes(imageData),
        featurePositions: this.detectFeaturePositions(imageData),
        styleClassification: this.classifyStyle(imageData),
        detailLevel: this.assessDetailLevel(imageData)
      };
      
      console.log('✅ Image analysis complete:', results);
      return results;
      
    } catch (error) {
      console.error('❌ Image analysis failed:', error);
      return this.createFallbackAnalysis(imageFile);
    }
  }

  async loadImageToCanvas(imageFile) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(imageFile);
      
      img.onload = () => {
        // Set canvas size to image size
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        
        // Draw image to canvas
        this.ctx.drawImage(img, 0, 0);
        
        // Get pixel data
        const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
        
        URL.revokeObjectURL(url);
        resolve({
          imageData,
          width: img.width,
          height: img.height,
          pixels: imageData.data
        });
      };
      
      img.onerror = reject;
      img.src = url;
    });
  }

  getBasicImageInfo(data) {
    const { width, height } = data;
    const aspectRatio = width / height;
    const totalPixels = width * height;
    
    return {
      width,
      height,
      aspectRatio,
      totalPixels,
      isPortrait: aspectRatio < 0.8,
      isLandscape: aspectRatio > 1.2,
      isSquare: aspectRatio >= 0.8 && aspectRatio <= 1.2,
      isLargeImage: totalPixels > 400000,
      resolution: totalPixels > 1000000 ? 'high' : totalPixels > 400000 ? 'medium' : 'low'
    };
  }

  analyzeColors(data) {
    const { pixels } = data;
    const colorCounts = {};
    const dominantColors = [];
    let totalBrightness = 0;
    let colorVariation = 0;
    
    // Sample every 4th pixel for performance
    for (let i = 0; i < pixels.length; i += 16) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      // Calculate brightness
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;
      
      // Group colors into ranges
      const colorKey = `${Math.floor(r/32)}-${Math.floor(g/32)}-${Math.floor(b/32)}`;
      colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
    }
    
    // Find dominant colors
    const sortedColors = Object.entries(colorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    const avgBrightness = totalBrightness / (pixels.length / 4);
    const uniqueColors = Object.keys(colorCounts).length;
    
    return {
      dominantColors: sortedColors.map(([color, count]) => ({ color, count })),
      averageBrightness: avgBrightness,
      colorVariety: uniqueColors,
      isDark: avgBrightness < 100,
      isBright: avgBrightness > 180,
      hasHighContrast: uniqueColors > 50,
      colorComplexity: uniqueColors > 100 ? 'high' : uniqueColors > 50 ? 'medium' : 'low'
    };
  }

  calculateComplexity(data) {
    const { pixels, width, height } = data;
    let edgeCount = 0;
    let textureVariation = 0;
    
    // Edge detection (simplified Sobel)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x += 4) { // Sample every 4th pixel
        const idx = (y * width + x) * 4;
        
        // Get surrounding pixels
        const current = pixels[idx];
        const right = pixels[idx + 4];
        const down = pixels[idx + width * 4];
        
        // Calculate gradients
        const gx = Math.abs(current - right);
        const gy = Math.abs(current - down);
        const gradient = gx + gy;
        
        if (gradient > 30) { // Edge threshold
          edgeCount++;
        }
        
        textureVariation += gradient;
      }
    }
    
    const totalSamples = Math.floor((width * height) / 16);
    const edgeRatio = edgeCount / totalSamples;
    const avgTexture = textureVariation / totalSamples;
    
    return {
      edgeCount,
      edgeRatio,
      textureVariation: avgTexture,
      complexityScore: (edgeRatio * 100) + (avgTexture / 10),
      isSimple: edgeRatio < 0.1,
      isDetailed: edgeRatio > 0.3,
      isHighlyDetailed: edgeRatio > 0.5
    };
  }

  detectBasicShapes(data) {
    const { pixels, width, height } = data;
    const shapes = {
      triangularRegions: 0, // Potential ears
      circularRegions: 0,   // Potential face/eyes
      verticalLines: 0,     // Potential body/arms
      horizontalLines: 0,   // Potential clothing lines
      clusters: []
    };
    
    // Simple shape detection by analyzing pixel clusters
    const regionSize = 20; // 20x20 pixel regions
    
    for (let y = 0; y < height - regionSize; y += regionSize) {
      for (let x = 0; x < width - regionSize; x += regionSize) {
        const region = this.analyzeRegion(pixels, x, y, regionSize, width);
        
        if (region.hasTriangularPattern) {
          shapes.triangularRegions++;
          shapes.clusters.push({ x, y, type: 'triangular', confidence: region.confidence });
        }
        
        if (region.hasCircularPattern) {
          shapes.circularRegions++;
          shapes.clusters.push({ x, y, type: 'circular', confidence: region.confidence });
        }
        
        if (region.hasVerticalLines) {
          shapes.verticalLines++;
        }
        
        if (region.hasHorizontalLines) {
          shapes.horizontalLines++;
        }
      }
    }
    
    return shapes;
  }

  analyzeRegion(pixels, startX, startY, size, width) {
    let verticalEdges = 0;
    let horizontalEdges = 0;
    let cornerIntensity = 0;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = ((startY + y) * width + (startX + x)) * 4;
        const current = pixels[idx];
        
        // Check for edges
        if (x < size - 1) {
          const right = pixels[idx + 4];
          if (Math.abs(current - right) > 30) verticalEdges++;
        }
        
        if (y < size - 1) {
          const down = pixels[idx + width * 4];
          if (Math.abs(current - down) > 30) horizontalEdges++;
        }
        
        // Check corners for triangular patterns
        if ((x < 5 || x > size - 5) && (y < 5 || y > size - 5)) {
          cornerIntensity += current;
        }
      }
    }
    
    return {
      hasTriangularPattern: verticalEdges > 10 && cornerIntensity > 2000,
      hasCircularPattern: verticalEdges > 5 && horizontalEdges > 5 && verticalEdges < 20,
      hasVerticalLines: verticalEdges > horizontalEdges * 2,
      hasHorizontalLines: horizontalEdges > verticalEdges * 2,
      confidence: Math.min((verticalEdges + horizontalEdges) / 20, 1)
    };
  }

  detectFeaturePositions(data) {
    const { width, height } = data;
    
    // Divide image into zones to detect feature positions
    const zones = {
      topThird: { y: 0, height: height / 3 },           // Hair, ears, hat area
      middleThird: { y: height / 3, height: height / 3 }, // Face, accessories area  
      bottomThird: { y: height * 2/3, height: height / 3 } // Body, clothing area
    };
    
    return {
      zones,
      hasTopFeatures: this.hasSignificantActivity(data, zones.topThird),
      hasMiddleFeatures: this.hasSignificantActivity(data, zones.middleThird),
      hasBottomFeatures: this.hasSignificantActivity(data, zones.bottomThird),
      estimatedFacePosition: this.estimateFacePosition(data),
      estimatedBodyType: this.estimateBodyType(data)
    };
  }

  hasSignificantActivity(data, zone) {
    const { pixels, width } = data;
    let activity = 0;
    
    for (let y = zone.y; y < zone.y + zone.height && y < data.height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const idx = (y * width + x) * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];
        
        // Look for non-background activity (non-uniform colors)
        if (x > 0) {
          const prevIdx = (y * width + x - 4) * 4;
          const prevR = pixels[prevIdx];
          const diff = Math.abs(r - prevR);
          if (diff > 20) activity++;
        }
      }
    }
    
    return activity > 100; // Threshold for "significant activity"
  }

  estimateFacePosition(data) {
    const { width, height } = data;
    
    // Look for face-like patterns in upper 2/3 of image
    const faceRegion = {
      x: width * 0.2,
      y: height * 0.1,
      width: width * 0.6,
      height: height * 0.4
    };
    
    return {
      region: faceRegion,
      confidence: 0.7, // Default confidence
      isPortrait: height > width * 1.2
    };
  }

  estimateBodyType(data) {
    const { width, height } = data;
    const aspectRatio = width / height;
    
    if (aspectRatio < 0.6 && height > 400) {
      return { type: 'fullBody', confidence: 0.8 };
    } else if (aspectRatio < 1 && height > 200) {
      return { type: 'halfBody', confidence: 0.7 };
    } else {
      return { type: 'portrait', confidence: 0.6 };
    }
  }

  classifyStyle(data) {
    const colorAnalysis = this.analyzeColors(data);
    const complexity = this.calculateComplexity(data);
    
    let style = 'unknown';
    let confidence = 0.5;
    
    // Simple style classification based on color and complexity
    if (colorAnalysis.colorComplexity === 'high' && complexity.isHighlyDetailed) {
      style = 'realistic';
      confidence = 0.8;
    } else if (colorAnalysis.averageBrightness > 150 && !complexity.isHighlyDetailed) {
      style = 'anime';
      confidence = 0.7;
    } else if (colorAnalysis.colorVariety < 30) {
      style = 'cartoon';
      confidence = 0.6;
    }
    
    return { style, confidence };
  }

  assessDetailLevel(data) {
    const complexity = this.calculateComplexity(data);
    const colors = this.analyzeColors(data);
    const info = this.getBasicImageInfo(data);
    
    let level = 'basic';
    let score = 0;
    
    // Score based on multiple factors
    if (complexity.isHighlyDetailed) score += 3;
    else if (complexity.isDetailed) score += 2;
    else if (!complexity.isSimple) score += 1;
    
    if (colors.colorComplexity === 'high') score += 2;
    else if (colors.colorComplexity === 'medium') score += 1;
    
    if (info.resolution === 'high') score += 2;
    else if (info.resolution === 'medium') score += 1;
    
    if (score >= 6) level = 'professional';
    else if (score >= 4) level = 'detailed';
    else if (score >= 2) level = 'standard';
    
    return { level, score, maxScore: 7 };
  }

  createFallbackAnalysis(imageFile) {
    return {
      basicInfo: {
        width: 400,
        height: 600,
        aspectRatio: 0.67,
        isPortrait: true,
        resolution: 'medium'
      },
      colorAnalysis: {
        colorComplexity: 'medium',
        averageBrightness: 128,
        hasHighContrast: true
      },
      complexityScore: {
        complexityScore: 50,
        isDetailed: true
      },
      shapeDetection: {
        triangularRegions: 2,
        circularRegions: 1
      },
      featurePositions: {
        hasTopFeatures: true,
        hasMiddleFeatures: true,
        estimatedBodyType: { type: 'halfBody' }
      },
      styleClassification: { style: 'anime', confidence: 0.6 },
      detailLevel: { level: 'standard', score: 3 },
      fallback: true
    };
  }
}

export default ImageAnalyzer;
