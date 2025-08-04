// src/components/AdvancedSegmentation.js
import * as bodyPix from '@tensorflow-models/body-pix';
import '@mediapipe/pose';
import '@mediapipe/face_mesh';
import '@mediapipe/hands';

class AdvancedSegmentation {
  constructor() {
    this.bodyPixModel = null;
    this.poseModel = null;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  async initialize() {
    console.log('🚀 Loading segmentation models...');
    
    // Load BodyPix for body part segmentation
    this.bodyPixModel = await bodyPix.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      multiplier: 0.75,
      quantBytes: 2
    });
    
    console.log('✅ Models loaded successfully!');
  }

  async segmentCharacter(imageUrl) {
    if (!this.bodyPixModel) {
      await this.initialize();
    }

    const img = await this.loadImage(imageUrl);
    this.canvas.width = img.width;
    this.canvas.height = img.height;
    this.ctx.drawImage(img, 0, 0);

    console.log('🎯 Starting AI-powered segmentation...');

    // Get body part segmentation from BodyPix
    const segmentation = await this.bodyPixModel.segmentPersonParts(img, {
      flipHorizontal: false,
      internalResolution: 'medium',
      segmentationThreshold: 0.7
    });

    // BodyPix parts mapping
    const partNames = [
      'left_face',
      'right_face', 
      'left_upper_arm_front',
      'left_upper_arm_back',
      'right_upper_arm_front',
      'right_upper_arm_back',
      'left_lower_arm_front',
      'left_lower_arm_back',
      'right_lower_arm_front',
      'right_lower_arm_back',
      'left_hand',
      'right_hand',
      'torso_front',
      'torso_back',
      'left_upper_leg_front',
      'left_upper_leg_back',
      'right_upper_leg_front',
      'right_upper_leg_back',
      'left_lower_leg_front',
      'left_lower_leg_back',
      'right_lower_leg_front',
      'right_lower_leg_back',
      'left_foot',
      'right_foot'
    ];

    // Create individual layers for each body part
    const layers = [];
    const processedParts = new Set();

    // Group related parts together
    const partGroups = {
      'head': [0, 1], // left_face, right_face
      'left_arm': [2, 3, 6, 7, 10], // upper arm, lower arm, hand
      'right_arm': [4, 5, 8, 9, 11],
      'torso': [12, 13],
      'left_leg': [14, 15, 18, 19, 22],
      'right_leg': [16, 17, 20, 21, 23]
    };

    // Create layers for each group
    let zIndex = 0;
    for (const [groupName, partIndices] of Object.entries(partGroups)) {
      const layerCanvas = document.createElement('canvas');
      layerCanvas.width = img.width;
      layerCanvas.height = img.height;
      const layerCtx = layerCanvas.getContext('2d');

      // Get original image data
      layerCtx.drawImage(img, 0, 0);
      const imageData = layerCtx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;

      // Apply segmentation mask
      let hasContent = false;
      for (let i = 0; i < segmentation.data.length; i++) {
        const partId = segmentation.data[i];
        
        // Check if this pixel belongs to our part group
        if (!partIndices.includes(partId)) {
          // Make pixel transparent
          data[i * 4 + 3] = 0;
        } else {
          hasContent = true;
        }
      }

      layerCtx.putImageData(imageData, 0, 0);

      if (hasContent) {
        layers.push({
          id: `${groupName}_layer`,
          type: groupName,
          imageData: layerCanvas.toDataURL('image/png'),
          zIndex: zIndex++,
          hasContent: true,
          bounds: this.calculateBounds(segmentation.data, partIndices, img.width, img.height)
        });
        
        console.log(`✅ Created ${groupName} layer`);
      }
    }

    // Add face details using facial landmark detection
    const faceDetails = await this.extractFaceDetails(img, segmentation);
    layers.push(...faceDetails);

    // Create background layer
    layers.unshift(await this.createBackgroundLayer(img, segmentation));

    return {
      layers,
      skeleton: this.extractSkeleton(segmentation, img.width, img.height),
      animations: this.createRealisticAnimations(layers)
    };
  }

  async extractFaceDetails(img, segmentation) {
    const layers = [];
    
    // Find face region
    const faceBounds = this.calculateBounds(segmentation.data, [0, 1], img.width, img.height);
    
    if (faceBounds.width > 0 && faceBounds.height > 0) {
      // Estimate eye positions (upper third of face)
      const eyeY = faceBounds.y + faceBounds.height * 0.3;
      const leftEyeX = faceBounds.x + faceBounds.width * 0.3;
      const rightEyeX = faceBounds.x + faceBounds.width * 0.7;
      
      // Create eye layers
      layers.push(
        this.createFeatureLayer(img, 'left_eye', {
          x: leftEyeX - 20,
          y: eyeY - 15,
          width: 40,
          height: 30
        }),
        this.createFeatureLayer(img, 'right_eye', {
          x: rightEyeX - 20,
          y: eyeY - 15,
          width: 40,
          height: 30
        })
      );
      
      // Estimate mouth position (lower third of face)
      const mouthY = faceBounds.y + faceBounds.height * 0.7;
      layers.push(
        this.createFeatureLayer(img, 'mouth', {
          x: faceBounds.x + faceBounds.width * 0.35,
          y: mouthY - 10,
          width: faceBounds.width * 0.3,
          height: 20
        })
      );
    }
    
    return layers.filter(l => l.hasContent);
  }

  createFeatureLayer(img, type, bounds) {
    const layerCanvas = document.createElement('canvas');
    layerCanvas.width = img.width;
    layerCanvas.height = img.height;
    const layerCtx = layerCanvas.getContext('2d');
    
    // Draw the feature region
    layerCtx.drawImage(
      img,
      bounds.x, bounds.y, bounds.width, bounds.height,
      bounds.x, bounds.y, bounds.width, bounds.height
    );
    
    return {
      id: `${type}_layer`,
      type: type,
      imageData: layerCanvas.toDataURL('image/png'),
      zIndex: 10, // Face features on top
      hasContent: bounds.width > 0,
      bounds: bounds
    };
  }

  async createBackgroundLayer(img, segmentation) {
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = img.width;
    bgCanvas.height = img.height;
    const bgCtx = bgCanvas.getContext('2d');
    
    bgCtx.drawImage(img, 0, 0);
    const imageData = bgCtx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;
    
    // Make all person pixels transparent
    for (let i = 0; i < segmentation.data.length; i++) {
      if (segmentation.data[i] !== -1) {
        data[i * 4 + 3] = 0;
      }
    }
    
    bgCtx.putImageData(imageData, 0, 0);
    
    return {
      id: 'background_layer',
      type: 'background',
      imageData: bgCanvas.toDataURL('image/png'),
      zIndex: -1,
      hasContent: true
    };
  }

  calculateBounds(segmentationData, partIndices, width, height) {
    let minX = width, maxX = 0, minY = height, maxY = 0;
    
    for (let i = 0; i < segmentationData.length; i++) {
      if (partIndices.includes(segmentationData[i])) {
        const x = i % width;
        const y = Math.floor(i / width);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  extractSkeleton(segmentation, width, height) {
    // Create a simple skeleton based on body part positions
    const skeleton = {
      joints: [],
      bones: []
    };
    
    // This would be enhanced with actual pose detection
    // For now, create basic joint positions
    const partGroups = {
      'head': [0, 1],
      'left_shoulder': [2, 3],
      'right_shoulder': [4, 5],
      'left_elbow': [6, 7],
      'right_elbow': [8, 9],
      'left_hand': [10],
      'right_hand': [11],
      'torso': [12, 13],
      'left_hip': [14, 15],
      'right_hip': [16, 17],
      'left_knee': [18, 19],
      'right_knee': [20, 21]
    };
    
    for (const [jointName, partIndices] of Object.entries(partGroups)) {
      const bounds = this.calculateBounds(segmentation.data, partIndices, width, height);
      if (bounds.width > 0) {
        skeleton.joints.push({
          name: jointName,
          x: bounds.x + bounds.width / 2,
          y: bounds.y + bounds.height / 2
        });
      }
    }
    
    // Define bone connections
    skeleton.bones = [
      ['head', 'torso'],
      ['torso', 'left_shoulder'],
      ['torso', 'right_shoulder'],
      ['left_shoulder', 'left_elbow'],
      ['right_shoulder', 'right_elbow'],
      ['left_elbow', 'left_hand'],
      ['right_elbow', 'right_hand'],
      ['torso', 'left_hip'],
      ['torso', 'right_hip'],
      ['left_hip', 'left_knee'],
      ['right_hip', 'right_knee']
    ];
    
    return skeleton;
  }

  createRealisticAnimations(layers) {
    return {
      blink: {
        layers: ['left_eye', 'right_eye'],
        keyframes: [
          { time: 0, scaleY: 1, originY: 0.5 },
          { time: 0.1, scaleY: 0.1, originY: 0.5 },
          { time: 0.2, scaleY: 1, originY: 0.5 }
        ],
        duration: 200,
        easing: 'ease-in-out'
      },
      smile: {
        layers: ['mouth'],
        keyframes: [
          { time: 0, scaleX: 1, scaleY: 1 },
          { time: 0.5, scaleX: 1.3, scaleY: 0.8 },
          { time: 1, scaleX: 1, scaleY: 1 }
        ],
        duration: 600,
        easing: 'ease-in-out'
      },
      wave: {
        layers: ['right_arm', 'right_hand'],
        keyframes: [
          { time: 0, rotate: 0, originX: 0.2, originY: 0.2 },
          { time: 0.25, rotate: -45, originX: 0.2, originY: 0.2 },
          { time: 0.5, rotate: -30, originX: 0.2, originY: 0.2 },
          { time: 0.75, rotate: -45, originX: 0.2, originY: 0.2 },
          { time: 1, rotate: 0, originX: 0.2, originY: 0.2 }
        ],
        duration: 1000,
        easing: 'ease-in-out'
      },
      headTurn: {
        layers: ['head'],
        keyframes: [
          { time: 0, rotate: 0, scaleX: 1 },
          { time: 0.5, rotate: 10, scaleX: 0.95 },
          { time: 1, rotate: 0, scaleX: 1 }
        ],
        duration: 1200,
        easing: 'ease-in-out'
      },
      idle: {
        layers: ['torso'],
        keyframes: [
          { time: 0, translateY: 0, scaleY: 1 },
          { time: 0.5, translateY: -3, scaleY: 1.02 },
          { time: 1, translateY: 0, scaleY: 1 }
        ],
        duration: 3000,
        easing: 'ease-in-out'
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
}

export default AdvancedSegmentation;
