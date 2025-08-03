// src/components/CharacterFeatureDetector.js
class CharacterFeatureDetector {
  constructor() {
    console.log('🎭 Initializing character feature detection...');
  }

  async detectCharacterFeatures(imageElement, objectDetections) {
    console.log('🔍 Analyzing character-specific features...');
    
    try {
      // Analyze image for anime/character features
      const features = {
        animeFeatures: await this.detectAnimeFeatures(imageElement),
        facialFeatures: await this.detectFacialFeatures(imageElement, objectDetections),
        characterType: await this.classifyCharacterType(imageElement, objectDetections),
        specialFeatures: await this.detectSpecialFeatures(imageElement)
      };
      
      console.log('✅ Character feature detection complete:', features);
      return features;
      
    } catch (error) {
      console.error('❌ Character detection failed:', error);
      return this.createFallbackFeatures();
    }
  }

  async detectAnimeFeatures(imageElement) {
    // Create canvas for pixel analysis
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = imageElement.width || 400;
    canvas.height = imageElement.height || 600;
    ctx.drawImage(imageElement, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    // Analyze for anime-specific characteristics
    const analysis = {
      hasLargeEyes: this.detectLargeEyes(pixels, canvas.width, canvas.height),
      hasPointedFeatures: this.detectPointedFeatures(pixels, canvas.width, canvas.height),
      hasUniformColors: this.detectUniformColors(pixels),
      hasBrightColors: this.detectBrightColors(pixels),
      hasAnimeStyle: false
    };
    
    // Determine if image has anime characteristics
    let animeScore = 0;
    if (analysis.hasLargeEyes) animeScore += 2;
    if (analysis.hasPointedFeatures) animeScore += 2;
    if (analysis.hasUniformColors) animeScore += 1;
    if (analysis.hasBrightColors) animeScore += 1;
    
    analysis.hasAnimeStyle = animeScore >= 3;
    analysis.animeConfidence = animeScore / 6;
    
    console.log(`🎭 Anime analysis: ${animeScore}/6 score, ${analysis.hasAnimeStyle ? 'IS' : 'NOT'} anime style`);
    
    return analysis;
  }

  detectLargeEyes(pixels, width, height) {
    // Look for large circular regions in upper third of image
    const upperThird = Math.floor(height / 3);
    let circularRegions = 0;
    
    // Sample regions looking for eye-like patterns
    for (let y = 0; y < upperThird; y += 10) {
      for (let x = 0; x < width; x += 10) {
        if (this.isEyeLikeRegion(pixels, x, y, width, height)) {
          circularRegions++;
        }
      }
    }
    
    return circularRegions > 2; // Multiple circular regions = likely large anime eyes
  }

  isEyeLikeRegion(pixels, centerX, centerY, width, height) {
    const radius = 15;
    let edgeCount = 0;
    let totalSamples = 0;
    
    // Check circular pattern around center point
    for (let angle = 0; angle < Math.PI * 2; angle += 0.5) {
      const x = Math.floor(centerX + Math.cos(angle) * radius);
      const y = Math.floor(centerY + Math.sin(angle) * radius);
      
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];
        
        // Check for high contrast (edge of eye)
        const brightness = (r + g + b) / 3;
        if (brightness < 100 || brightness > 200) {
          edgeCount++;
        }
        totalSamples++;
      }
    }
    
    return totalSamples > 0 && (edgeCount / totalSamples) > 0.5;
  }

  detectPointedFeatures(pixels, width, height) {
    // Look for triangular patterns that could be ears
    let triangularCount = 0;
    const topQuarter = Math.floor(height / 4);
    
    for (let y = 0; y < topQuarter; y += 15) {
      for (let x = width * 0.2; x < width * 0.8; x += 15) {
        if (this.isTriangularRegion(pixels, x, y, width, height)) {
          triangularCount++;
        }
      }
    }
    
    return triangularCount > 3; // Multiple triangular patterns = likely pointed features
  }

  isTriangularRegion(pixels, centerX, centerY, width, height) {
    const size = 10;
    let topEdges = 0;
    let bottomEdges = 0;
    
    // Check for triangular pattern (more edges at top, fewer at bottom)
    for (let dy = -size; dy <= size; dy++) {
      for (let dx = -size; dx <= size; dx++) {
        const x = Math.floor(centerX + dx);
        const y = Math.floor(centerY + dy);
        
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const idx = (y * width + x) * 4;
          const current = pixels[idx];
          
          if (x < width - 1) {
            const right = pixels[idx + 4];
            const diff = Math.abs(current - right);
            
            if (diff > 30) {
              if (dy < 0) topEdges++;
              else bottomEdges++;
            }
          }
        }
      }
    }
    
    return topEdges > bottomEdges * 1.5; // More edges at top = triangular
  }

  detectUniformColors(pixels) {
    const colorGroups = {};
    let samples = 0;
    
    // Sample colors throughout image
    for (let i = 0; i < pixels.length; i += 64) { // Sample every 16th pixel
      const r = Math.floor(pixels[i] / 32);
      const g = Math.floor(pixels[i + 1] / 32);
      const b = Math.floor(pixels[i + 2] / 32);
      
      const colorKey = `${r}-${g}-${b}`;
      colorGroups[colorKey] = (colorGroups[colorKey] || 0) + 1;
      samples++;
    }
    
    const uniqueColors = Object.keys(colorGroups).length;
    const uniformity = samples / uniqueColors;
    
    return uniformity > 100; // High uniformity = anime-style coloring
  }

  detectBrightColors(pixels) {
    let brightPixels = 0;
    let totalSamples = 0;
    
    for (let i = 0; i < pixels.length; i += 16) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      const brightness = (r + g + b) / 3;
      const saturation = Math.max(r, g, b) - Math.min(r, g, b);
      
      if (brightness > 150 && saturation > 50) {
        brightPixels++;
      }
      totalSamples++;
    }
    
    return (brightPixels / totalSamples) > 0.3; // 30%+ bright colors = anime style
  }

  async detectFacialFeatures(imageElement, objectDetections) {
    const features = {
      hasFace: false,
      faceCount: 0,
      faceSize: 'medium',
      eyeRegions: [],
      mouthRegions: [],
      confidence: 0
    };
    
    // Check if person was detected by object detection
    if (objectDetections.people.length > 0) {
      features.hasFace = true;
      features.faceCount = objectDetections.people.length;
      features.confidence = objectDetections.people[0].confidence;
      
      // Estimate face size based on bounding box
      const personBox = objectDetections.people[0].bbox;
      const faceArea = personBox[2] * personBox[3];
      
      if (faceArea > 200000) features.faceSize = 'large';
      else if (faceArea < 50000) features.faceSize = 'small';
      
      console.log(`👤 Face detected: ${features.faceCount} face(s), size: ${features.faceSize}`);
    }
    
    return features;
  }

  async classifyCharacterType(imageElement, objectDetections) {
    const classification = {
      type: 'unknown',
      isHuman: false,
      isAnime: false,
      isAnimal: false,
      confidence: 0
    };
    
    // Classify based on object detections
    if (objectDetections.people.length > 0) {
      classification.isHuman = true;
      classification.type = 'human_character';
      classification.confidence = objectDetections.people[0].confidence;
    }
    
    if (objectDetections.animals.length > 0) {
      classification.isAnimal = true;
      classification.type = 'animal_character';
      classification.confidence = Math.max(classification.confidence, objectDetections.animals[0].confidence);
    }
    
    // Mixed human + animal = hybrid character
    if (classification.isHuman && classification.isAnimal) {
      classification.type = 'hybrid_character';
      classification.confidence = 0.8;
    }
    
    console.log(`🎭 Character type: ${classification.type} (${Math.round(classification.confidence * 100)}%)`);
    
    return classification;
  }

  async detectSpecialFeatures(imageElement) {
    const features = {
      hasEars: false,
      hasTail: false,
      hasWings: false,
      hasHorns: false,
      hasAccessories: false,
      specialCount: 0
    };
    
    // This would use specialized models, for now we'll use heuristics
    // In a real implementation, we'd use trained models for these specific features
    
    return features;
  }

  createFallbackFeatures() {
    return {
      animeFeatures: {
        hasAnimeStyle: true,
        animeConfidence: 0.6
      },
      facialFeatures: {
        hasFace: true,
        faceCount: 1,
        confidence: 0.7
      },
      characterType: {
        type: 'anime_character',
        isHuman: true,
        confidence: 0.6
      },
      specialFeatures: {
        specialCount: 0
      },
      fallback: true
    };
  }
}

export default CharacterFeatureDetector;
