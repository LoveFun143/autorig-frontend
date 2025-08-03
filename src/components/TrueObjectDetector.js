// src/components/TrueObjectDetector.js
import * as tf from '@tensorflow/tfjs';

class TrueObjectDetector {
  constructor() {
    this.model = null;
    this.isLoaded = false;
    console.log('🧠 Initializing TRUE object detection...');
  }

  async loadModel() {
    if (this.isLoaded) return;
    
    try {
      console.log('📦 Loading COCO-SSD model...');
      
      // Load TensorFlow.js and COCO-SSD model
      await tf.ready();
      
      // Import COCO-SSD dynamically
      const cocoSsd = await import('@tensorflow-models/coco-ssd');
      this.model = await cocoSsd.load();
      
      this.isLoaded = true;
      console.log('✅ COCO-SSD model loaded successfully!');
      
    } catch (error) {
      console.error('❌ Failed to load object detection model:', error);
      throw error;
    }
  }

  async detectObjects(imageElement) {
    if (!this.isLoaded) {
      await this.loadModel();
    }
    
    try {
      console.log('🔍 Running REAL object detection...');
      
      // Run object detection on image
      const predictions = await this.model.detect(imageElement);
      
      console.log('✅ Object detection complete:', predictions);
      return this.processDetections(predictions);
      
    } catch (error) {
      console.error('❌ Object detection failed:', error);
      return this.createFallbackDetection();
    }
  }

  processDetections(predictions) {
    console.log(`🎯 Processing ${predictions.length} detected objects...`);
    
    const detectedObjects = {
      people: [],
      clothing: [],
      accessories: [],
      animals: [],
      objects: [],
      confidence: 0
    };
    
    let totalConfidence = 0;
    let validDetections = 0;
    
    predictions.forEach(prediction => {
      const { class: className, score, bbox } = prediction;
      
      // Only include high confidence detections
      if (score > 0.3) {
        console.log(`✅ Detected: ${className} (${Math.round(score * 100)}% confidence)`);
        
        // Categorize detections
        if (this.isPersonClass(className)) {
          detectedObjects.people.push({
            type: className,
            confidence: score,
            bbox: bbox,
            area: bbox[2] * bbox[3]
          });
        } else if (this.isClothingClass(className)) {
          detectedObjects.clothing.push({
            type: className,
            confidence: score,
            bbox: bbox
          });
        } else if (this.isAccessoryClass(className)) {
          detectedObjects.accessories.push({
            type: className,
            confidence: score,
            bbox: bbox
          });
        } else if (this.isAnimalClass(className)) {
          detectedObjects.animals.push({
            type: className,
            confidence: score,
            bbox: bbox
          });
        } else {
          detectedObjects.objects.push({
            type: className,
            confidence: score,
            bbox: bbox
          });
        }
        
        totalConfidence += score;
        validDetections++;
      }
    });
    
    detectedObjects.confidence = validDetections > 0 ? totalConfidence / validDetections : 0;
    detectedObjects.totalDetections = validDetections;
    
    return detectedObjects;
  }

  isPersonClass(className) {
    const personClasses = ['person', 'man', 'woman', 'child', 'boy', 'girl'];
    return personClasses.includes(className.toLowerCase());
  }

  isClothingClass(className) {
    const clothingClasses = [
      'shirt', 'pants', 'dress', 'jacket', 'coat', 'sweater',
      'skirt', 'shorts', 'jeans', 'suit', 'uniform', 'clothing'
    ];
    return clothingClasses.includes(className.toLowerCase());
  }

  isAccessoryClass(className) {
    const accessoryClasses = [
      'hat', 'cap', 'glasses', 'sunglasses', 'bag', 'purse',
      'backpack', 'jewelry', 'watch', 'necklace', 'earrings',
      'bracelet', 'ring', 'scarf', 'tie', 'belt'
    ];
    return accessoryClasses.includes(className.toLowerCase());
  }

  isAnimalClass(className) {
    const animalClasses = [
      'cat', 'dog', 'bird', 'horse', 'sheep', 'cow', 'elephant',
      'bear', 'zebra', 'giraffe', 'animal', 'pet'
    ];
    return animalClasses.includes(className.toLowerCase());
  }

  createFallbackDetection() {
    return {
      people: [{ type: 'person', confidence: 0.7, bbox: [0, 0, 400, 600] }],
      clothing: [{ type: 'shirt', confidence: 0.6, bbox: [100, 200, 200, 150] }],
      accessories: [],
      animals: [],
      objects: [],
      confidence: 0.6,
      totalDetections: 2,
      fallback: true
    };
  }
}

export default TrueObjectDetector;
