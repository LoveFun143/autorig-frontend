// src/components/ImageAnalyzer.js
import TrueObjectDetector from './TrueObjectDetector';
import CharacterFeatureDetector from './CharacterFeatureDetector';

class ImageAnalyzer {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.objectDetector = new TrueObjectDetector();
    this.featureDetector = new CharacterFeatureDetector();
  }

  async analyzeImage(imageFile) {
    console.log('🔍 Starting TRUE image analysis with AI...');
    
    try {
      // Load image into canvas
      const imageData = await this.loadImageToCanvas(imageFile);
      
      // Create image element for AI models
      const imageElement = await this.createImageElement(imageFile);
      
      console.log('🧠 Running AI object detection...');
      
      // Step 1: Real object detection
      const objectDetections = await this.objectDetector.detectObjects(imageElement);
      
      console.log('🎭 Running character feature detection...');
      
      // Step 2: Character-specific analysis
      const characterFeatures = await this.featureDetector.detectCharacterFeatures(imageElement, objectDetections);
      
      // Step 3: Combine with basic analysis
      const basicAnalysis = {
        basicInfo: this.getBasicImageInfo(imageData),
        colorAnalysis: this.analyzeColors(imageData),
        complexityScore: this.calculateComplexity(imageData)
      };
      
      // Step 4: Create comprehensive results
      const results = {
        ...basicAnalysis,
        objectDetections,
        characterFeatures,
        trueRecognition: this.createTrueRecognition(objectDetections, characterFeatures, basicAnalysis),
        aiAnalysisUsed: true
      };
      
      console.log('✅ TRUE AI analysis complete:', results);
      return results;
      
    } catch (error) {
      console.error('❌ TRUE AI analysis failed:', error);
      return this.createFallbackAnalysis(imageFile);
    }
  }

  async createImageElement(imageFile) {
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

  createTrueRecognition(objectDetections, characterFeatures, basicAnalysis) {
    console.log('🎯 Creating TRUE recognition summary...');
    
    const recognition = {
      detectedObjects: [],
      characterType: 'unknown',
      styleDetected: 'unknown',
      specialFeatures: [],
      confidence: 0,
      layerSuggestions: []
    };
    
    let totalConfidence = 0;
    let confidenceCount = 0;
    
    // Process object detections
    if (objectDetections.people.length > 0) {
      recognition.detectedObjects.push(`${objectDetections.people.length} person(s)`);
      recognition.characterType = 'human';
      totalConfidence += objectDetections.people[0].confidence;
      confidenceCount++;
      
      console.log(`✅ TRUE DETECTION: ${objectDetections.people.length} person(s) detected`);
    }
    
    if (objectDetections.animals.length > 0) {
      objectDetections.animals.forEach(animal => {
        recognition.detectedObjects.push(`${animal.type}`);
        recognition.specialFeatures.push(`${animal.type}_features`);
      });
      
      if (recognition.characterType === 'human') {
        recognition.characterType = 'hybrid';
      } else {
        recognition.characterType = 'animal';
      }
      
      totalConfidence += objectDetections.animals[0].confidence;
      confidenceCount++;
      
      console.log(`✅ TRUE DETECTION: Animals detected - ${objectDetections.animals.map(a => a.type).join(', ')}`);
    }
    
    if (objectDetections.clothing.length > 0) {
      objectDetections.clothing.forEach(clothing => {
        recognition.detectedObjects.push(`${clothing.type}`);
        recognition.layerSuggestions.push(clothing.type);
      });
      
      console.log(`✅ TRUE DETECTION: Clothing detected - ${objectDetections.clothing.map(c => c.type).join(', ')}`);
    }
    
    if (objectDetections.accessories.length > 0) {
      objectDetections.accessories.forEach(accessory => {
        recognition.detectedObjects.push(`${accessory.type}`);
        recognition.specialFeatures.push(accessory.type);
        recognition.layerSuggestions.push(accessory.type);
      });
      
      console.log(`✅ TRUE DETECTION: Accessories detected - ${objectDetections.accessories.map(a => a.type).join(', ')}`);
    }
    
    // Process character features
    if (characterFeatures.animeFeatures.hasAnimeStyle) {
      recognition.styleDetected = 'anime';
      totalConfidence += characterFeatures.animeFeatures.animeConfidence;
      confidenceCount++;
      
      console.log(`✅ TRUE DETECTION: Anime style detected (${Math.round(characterFeatures.animeFeatures.animeConfidence * 100)}%)`);
    }
    
    if (characterFeatures.facialFeatures.hasFace) {
      recognition.layerSuggestions.push('face', 'eyes', 'mouth');
      totalConfidence += characterFeatures.facialFeatures.confidence;
      confidenceCount++;
      
      console.log(`✅ TRUE DETECTION: Face detected with ${characterFeatures.facialFeatures.faceCount} face(s)`);
    }
    
    if (characterFeatures.specialFeatures.hasAccessories) {
      recognition.specialFeatures.push('accessories');
      console.log(`✅ TRUE DETECTION: Special accessories detected`);
    }
    
    // Calculate overall confidence
    recognition.confidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
    
    // Generate layer suggestions based on true detections
    recognition.layerSuggestions = this.generateTrueLayerSuggestions(recognition, basicAnalysis);
    
    return recognition;
  }

  generateTrueLayerSuggestions(recognition, basicAnalysis) {
    const layers = ['background']; // Always include background
    
    console.log('🎯 Generating layers based on TRUE detections...');
    
    // Add layers based on actual detections
    if (recognition.characterType === 'human' || recognition.characterType === 'hybrid') {
      layers.push('face', 'left_eye', 'right_eye', 'nose', 'mouth');
      
      if (recognition.styleDetected === 'anime') {
        layers.push('anime_eyes', 'hair_front', 'hair_back');
      } else {
        layers.push('hair');
      }
    }
    
    if (recognition.characterType === 'animal' || recognition.characterType === 'hybrid') {
      layers.push('animal_ears', 'animal_features');
      
      if (recognition.detectedObjects.includes('cat')) {
        layers.push('cat_ears', 'whiskers');
        console.log('🐱 TRUE CAT DETECTION: Adding cat-specific layers');
      }
    }
    
    // Add clothing layers based on actual detections
    recognition.layerSuggestions.forEach(suggestion => {
      if (!layers.includes(suggestion)) {
        layers.push(suggestion);
      }
    });
    
    // Add body layers for human characters
    if (recognition.characterType === 'human' || recognition.characterType === 'hybrid') {
      if (basicAnalysis.basicInfo.isLargeImage) {
        layers.push('torso', 'left_arm', 'right_arm', 'left_leg', 'right_leg');
      } else {
        layers.push('body', 'arms');
      }
    }
    
    // Add special feature layers
    recognition.specialFeatures.forEach(feature => {
      if (!layers.includes(feature)) {
        layers.push(feature);
      }
    });
    
    console.log(`🎯 Generated ${layers.length} layers based on TRUE detections:`, layers);
    
    return layers;
  }

  // Keep existing basic analysis methods
  async loadImageToCanvas(imageFile) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(imageFile);
      
      img.onload = () => {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);
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
    let totalBrightness = 0;
    
    for (let i = 0; i < pixels.length; i += 16) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;
      
      const colorKey = `${Math.floor(r/32)}-${Math.floor(g/32)}-${Math.floor(b/32)}`;
      colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
    }
    
    const avgBrightness = totalBrightness / (pixels.length / 4);
    const uniqueColors = Object.keys(colorCounts).length;
    
    return {
      averageBrightness: avgBrightness,
      colorVariety: uniqueColors,
      isDark: avgBrightness < 100,
      isBright: avgBrightness > 180,
      colorComplexity: uniqueColors > 100 ? 'high' : uniqueColors > 50 ? 'medium' : 'low'
    };
  }

  calculateComplexity(data) {
    const { pixels, width, height } = data;
    let edgeCount = 0;
    
    for (let y = 1; y < height - 1; y += 4) {
      for (let x = 1; x < width - 1; x += 4) {
        const idx = (y * width + x) * 4;
        const current = pixels[idx];
        const right = pixels[idx + 4];
        const down = pixels[idx + width * 4];
        
        const gx = Math.abs(current - right);
        const gy = Math.abs(current - down);
        const gradient = gx + gy;
        
        if (gradient > 30) {
          edgeCount++;
        }
      }
    }
    
    const totalSamples = Math.floor((width * height) / 16);
    const edgeRatio = edgeCount / totalSamples;
    
    return {
      edgeCount,
      edgeRatio,
      complexityScore: edgeRatio * 100,
      isSimple: edgeRatio < 0.1,
      isDetailed: edgeRatio > 0.3,
      isHighlyDetailed: edgeRatio > 0.5
    };
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
        averageBrightness: 128
      },
      complexityScore: {
        complexityScore: 50,
        isDetailed: true
      },
      objectDetections: {
        people: [{ type: 'person', confidence: 0.7 }],
        totalDetections: 1,
        fallback: true
      },
      characterFeatures: {
        animeFeatures: { hasAnimeStyle: true, animeConfidence: 0.6 },
        facialFeatures: { hasFace: true, faceCount: 1 },
        characterType: { type: 'anime_character', isHuman: true }
      },
      trueRecognition: {
        detectedObjects: ['person'],
        characterType: 'human',
        styleDetected: 'anime',
        confidence: 0.6,
        layerSuggestions: ['background', 'face', 'hair', 'body', 'clothing']
      },
      aiAnalysisUsed: false,
      fallback: true
    };
  }
}

export default ImageAnalyzer;
