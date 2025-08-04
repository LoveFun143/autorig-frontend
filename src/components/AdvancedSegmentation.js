// src/components/AdvancedSegmentation.js
import * as bodyPix from '@tensorflow-models/body-pix';

class AdvancedSegmentation {
  constructor() {
    this.bodyPixModel = null;
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

    // Create layers for each body part group
    const layers = [];
    const partGroups = {
      'head': [0, 1],
      'left_arm': [2, 3, 6, 7, 10],
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
          hasContent: true
        });
        
        console.log(`✅ Created ${groupName} layer`);
      }
    }

    return {
      layers,
      skeleton: this.createSkeleton(),
      animations: this.createAnimations()
    };
  }

  createSkeleton() {
    return {
      joints: [
        { name: 'head', x: 0, y: 0 },
        { name: 'torso', x: 0, y: 100 },
        { name: 'left_shoulder', x: -50, y: 50 },
        { name: 'right_shoulder', x: 50, y: 50 }
      ],
      bones: [
        ['head', 'torso'],
        ['torso', 'left_shoulder'],
        ['torso', 'right_shoulder']
      ]
    };
  }

  createAnimations() {
    return {
      blink: {
        layers: ['left_eye', 'right_eye'],
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
          { time: 0, scaleX: 1, scaleY: 1 },
          { time: 0.5, scaleX: 1.3, scaleY: 0.8 },
          { time: 1, scaleX: 1, scaleY: 1 }
        ],
        duration: 600
      },
      wave: {
        layers: ['right_arm'],
        keyframes: [
          { time: 0, rotate: 0 },
          { time: 0.25, rotate: -45 },
          { time: 0.75, rotate: 45 },
          { time: 1, rotate: 0 }
        ],
        duration: 1000
      },
      headTurn: {
        layers: ['head'],
        keyframes: [
          { time: 0, rotate: 0 },
          { time: 0.5, rotate: 10 },
          { time: 1, rotate: 0 }
        ],
        duration: 1200
      },
      idle: {
        layers: ['torso'],
        keyframes: [
          { time: 0, translateY: 0 },
          { time: 0.5, translateY: -3 },
          { time: 1, translateY: 0 }
        ],
        duration: 3000
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
