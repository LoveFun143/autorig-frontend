// src/components/PreciseBodyTracer.js
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import '@mediapipe/pose';
import '@mediapipe/face_mesh';

class PreciseBodyTracer {
  constructor() {
    this.poseDetector = null;
    this.faceDetector = null;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  async initialize() {
    console.log('🚀 Loading precise body detection models...');
    
    try {
      // Initialize MediaPipe Pose for full body detection
      this.poseDetector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet, 
        {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true
        }
      );
      
      // Initialize Face Mesh for detailed face detection
      this.faceDetector = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          refineLandmarks: true,
          maxFaces: 1
        }
      );
      
      console.log('✅ Body detection models loaded!');
    } catch (error) {
      console.error('Failed to load detection models:', error);
    }
  }

  async traceBodyParts(imageUrl) {
    if (!this.poseDetector) {
      await this.initialize();
    }

    const img = await this.loadImage(imageUrl);
    this.canvas.width = img.width;
    this.canvas.height = img.height;
    this.ctx.drawImage(img, 0, 0);

    console.log('🎯 Detecting body parts with AI...');

    // Detect pose keypoints
    const poses = await this.poseDetector.estimatePoses(img);
    const pose = poses[0]; // Get first detected pose
    
    // Detect face landmarks
    const faces = await this.faceDetector.estimateFaces(img);
    const face = faces[0]; // Get first detected face

    console.log(`📍 Detected ${pose ? pose.keypoints.length : 0} body keypoints`);
    console.log(`👤 Detected ${face ? face.keypoints.length : 0} face landmarks`);

    // Create precise body part traces
    const bodyParts = this.extractBodyParts(pose, face, img);
    
    // Generate layer for each body part
    const layers = await this.createTracedLayers(bodyParts, img);
    
    return {
      layers,
      skeleton: this.createSkeletonFromPose(pose),
      animations: this.createPreciseAnimations(bodyParts),
      keypoints: {
        pose: pose?.keypoints || [],
        face: face?.keypoints || []
      }
    };
  }

  extractBodyParts(pose, face, img) {
    const parts = {};
    
    if (pose && pose.keypoints) {
      const kp = pose.keypoints;
      
      // Head region (from nose to ears)
      const nose = kp.find(k => k.name === 'nose');
      const leftEar = kp.find(k => k.name === 'left_ear');
      const rightEar = kp.find(k => k.name === 'right_ear');
      
      if (nose && leftEar && rightEar) {
        parts.head = {
          center: { x: nose.x, y: nose.y },
          bounds: this.getBoundsFromPoints([nose, leftEar, rightEar]),
          keypoints: [nose, leftEar, rightEar]
        };
      }
      
      // Eyes (from eye keypoints)
      const leftEye = kp.find(k => k.name === 'left_eye');
      const rightEye = kp.find(k => k.name === 'right_eye');
      
      if (leftEye && rightEye) {
        parts.eyes = {
          left: { x: leftEye.x, y: leftEye.y },
          right: { x: rightEye.x, y: rightEye.y },
          bounds: this.getBoundsFromPoints([leftEye, rightEye]),
          keypoints: [leftEye, rightEye]
        };
      }
      
      // Torso (from shoulders to hips)
      const leftShoulder = kp.find(k => k.name === 'left_shoulder');
      const rightShoulder = kp.find(k => k.name === 'right_shoulder');
      const leftHip = kp.find(k => k.name === 'left_hip');
      const rightHip = kp.find(k => k.name === 'right_hip');
      
      if (leftShoulder && rightShoulder && leftHip && rightHip) {
        parts.torso = {
          corners: [leftShoulder, rightShoulder, rightHip, leftHip],
          bounds: this.getBoundsFromPoints([leftShoulder, rightShoulder, leftHip, rightHip]),
          keypoints: [leftShoulder, rightShoulder, leftHip, rightHip]
        };
      }
      
      // Left arm (shoulder to elbow to wrist)
      const leftElbow = kp.find(k => k.name === 'left_elbow');
      const leftWrist = kp.find(k => k.name === 'left_wrist');
      
      if (leftShoulder && leftElbow && leftWrist) {
        parts.left_arm = {
          joints: [leftShoulder, leftElbow, leftWrist],
          bounds: this.getBoundsFromPoints([leftShoulder, leftElbow, leftWrist]),
          keypoints: [leftShoulder, leftElbow, leftWrist]
        };
      }
      
      // Right arm
      const rightElbow = kp.find(k => k.name === 'right_elbow');
      const rightWrist = kp.find(k => k.name === 'right_wrist');
      
      if (rightShoulder && rightElbow && rightWrist) {
        parts.right_arm = {
          joints: [rightShoulder, rightElbow, rightWrist],
          bounds: this.getBoundsFromPoints([rightShoulder, rightElbow, rightWrist]),
          keypoints: [rightShoulder, rightElbow, rightWrist]
        };
      }
      
      // Left leg (hip to knee to ankle)
      const leftKnee = kp.find(k => k.name === 'left_knee');
      const leftAnkle = kp.find(k => k.name === 'left_ankle');
      
      if (leftHip && leftKnee && leftAnkle) {
        parts.left_leg = {
          joints: [leftHip, leftKnee, leftAnkle],
          bounds: this.getBoundsFromPoints([leftHip, leftKnee, leftAnkle]),
          keypoints: [leftHip, leftKnee, leftAnkle]
        };
      }
      
      // Right leg
      const rightKnee = kp.find(k => k.name === 'right_knee');
      const rightAnkle = kp.find(k => k.name === 'right_ankle');
      
      if (rightHip && rightKnee && rightAnkle) {
        parts.right_leg = {
          joints: [rightHip, rightKnee, rightAnkle],
          bounds: this.getBoundsFromPoints([rightHip, rightKnee, rightAnkle]),
          keypoints: [rightHip, rightKnee, rightAnkle]
        };
      }
    }
    
    // Add detailed face parts if detected
    if (face && face.keypoints) {
      const faceParts = this.extractFaceParts(face.keypoints);
      parts.face_details = faceParts;
    }
    
    return parts;
  }

  extractFaceParts(faceKeypoints) {
    // MediaPipe Face Mesh has 468 landmarks
    // Key indices for facial features:
    const parts = {
      leftEye: [],
      rightEye: [],
      lips: [],
      nose: [],
      leftEyebrow: [],
      rightEyebrow: []
    };
    
    // Extract eye contours (landmarks 33-42 for right eye, 263-272 for left eye)
    for (let i = 33; i <= 42; i++) {
      if (faceKeypoints[i]) parts.rightEye.push(faceKeypoints[i]);
    }
    for (let i = 263; i <= 272; i++) {
      if (faceKeypoints[i]) parts.leftEye.push(faceKeypoints[i]);
    }
    
    // Extract lip contours (landmarks 61-91)
    for (let i = 61; i <= 91; i++) {
      if (faceKeypoints[i]) parts.lips.push(faceKeypoints[i]);
    }
    
    // Extract nose (landmarks 1-5)
    for (let i = 1; i <= 5; i++) {
      if (faceKeypoints[i]) parts.nose.push(faceKeypoints[i]);
    }
    
    return parts;
  }

  getBoundsFromPoints(points) {
    if (!points || points.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    for (const point of points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }
    
    // Add padding around detected bounds
    const padding = 20;
    return {
      x: Math.max(0, minX - padding),
      y: Math.max(0, minY - padding),
      width: (maxX - minX) + padding * 2,
      height: (maxY - minY) + padding * 2
    };
  }

  async createTracedLayers(bodyParts, img) {
    const layers = [];
    let zIndex = 0;
    
    // Create background layer first
    layers.push(await this.createBackgroundLayer(img, bodyParts));
    
    // Create a layer for each detected body part
    for (const [partName, partData] of Object.entries(bodyParts)) {
      if (partName === 'face_details') {
        // Create separate layers for detailed face parts
        const faceLayers = await this.createFaceLayers(partData, img);
        layers.push(...faceLayers);
      } else {
        const layer = await this.createBodyPartLayer(img, partName, partData, zIndex++);
        if (layer.hasContent) {
          layers.push(layer);
        }
      }
    }
    
    return layers;
  }

  async createBodyPartLayer(img, partName, partData, zIndex) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, img.width, img.height);
    
    if (!partData.bounds || partData.bounds.width === 0) {
      return {
        id: `${partName}_layer`,
        type: partName,
        imageData: canvas.toDataURL('image/png'),
        zIndex,
        hasContent: false
      };
    }
    
    // Create a path that traces the body part
    ctx.save();
    ctx.beginPath();
    
    if (partData.keypoints && partData.keypoints.length > 0) {
      // Create smooth curve through keypoints
      this.drawSmoothPath(ctx, partData.keypoints);
    } else {
      // Fallback to rectangular region
      ctx.rect(partData.bounds.x, partData.bounds.y, partData.bounds.width, partData.bounds.height);
    }
    
    ctx.closePath();
    ctx.clip();
    
    // Draw the image only within the traced path
    ctx.drawImage(img, 0, 0);
    ctx.restore();
    
    return {
      id: `${partName}_layer`,
      type: partName,
      imageData: canvas.toDataURL('image/png'),
      zIndex,
      hasContent: true,
      bounds: partData.bounds,
      keypoints: partData.keypoints || []
    };
  }

  drawSmoothPath(ctx, keypoints) {
    if (keypoints.length < 2) return;
    
    // Start at first point
    ctx.moveTo(keypoints[0].x, keypoints[0].y);
    
    // Draw smooth curves through points
    for (let i = 1; i < keypoints.length - 1; i++) {
      const cp = keypoints[i];
      const next = keypoints[i + 1];
      
      // Use quadratic curve for smoother lines
      const cpx = (cp.x + next.x) / 2;
      const cpy = (cp.y + next.y) / 2;
      ctx.quadraticCurveTo(cp.x, cp.y, cpx, cpy);
    }
    
    // Connect to last point
    const last = keypoints[keypoints.length - 1];
    ctx.lineTo(last.x, last.y);
  }

  async createFaceLayers(faceDetails, img) {
    const layers = [];
    
    // Create eye layers with precise eye contours
    if (faceDetails.leftEye && faceDetails.leftEye.length > 0) {
      layers.push(await this.createFeatureLayer(img, 'left_eye', faceDetails.leftEye, 10));
    }
    
    if (faceDetails.rightEye && faceDetails.rightEye.length > 0) {
      layers.push(await this.createFeatureLayer(img, 'right_eye', faceDetails.rightEye, 10));
    }
    
    // Create mouth layer with lip contours
    if (faceDetails.lips && faceDetails.lips.length > 0) {
      layers.push(await this.createFeatureLayer(img, 'mouth', faceDetails.lips, 11));
    }
    
    return layers.filter(l => l.hasContent);
  }

  async createFeatureLayer(img, featureName, keypoints, zIndex) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, img.width, img.height);
    
    if (!keypoints || keypoints.length === 0) {
      return {
        id: `${featureName}_layer`,
        type: featureName,
        imageData: canvas.toDataURL('image/png'),
        zIndex,
        hasContent: false
      };
    }
    
    // Create precise path from keypoints
    ctx.save();
    ctx.beginPath();
    
    // Draw closed path through all keypoints
    ctx.moveTo(keypoints[0].x, keypoints[0].y);
    for (let i = 1; i < keypoints.length; i++) {
      ctx.lineTo(keypoints[i].x, keypoints[i].y);
    }
    ctx.closePath();
    ctx.clip();
    
    // Draw image within the traced feature
    ctx.drawImage(img, 0, 0);
    ctx.restore();
    
    return {
      id: `${featureName}_layer`,
      type: featureName,
      imageData: canvas.toDataURL('image/png'),
      zIndex,
      hasContent: true,
      keypoints
    };
  }

  async createBackgroundLayer(img, bodyParts) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    
    // Draw full image
    ctx.drawImage(img, 0, 0);
    
    // Cut out all body parts to leave only background
    ctx.globalCompositeOperation = 'destination-out';
    
    for (const [partName, partData] of Object.entries(bodyParts)) {
      if (partData.bounds && partData.bounds.width > 0) {
        ctx.fillRect(
          partData.bounds.x,
          partData.bounds.y,
          partData.bounds.width,
          partData.bounds.height
        );
      }
    }
    
    return {
      id: 'background_layer',
      type: 'background',
      imageData: canvas.toDataURL('image/png'),
      zIndex: -1,
      hasContent: true
    };
  }

  createSkeletonFromPose(pose) {
    if (!pose || !pose.keypoints) {
      return { joints: [], bones: [] };
    }
    
    const joints = pose.keypoints.map(kp => ({
      name: kp.name,
      x: kp.x,
      y: kp.y,
      confidence: kp.score
    }));
    
    // Define bone connections based on pose model
    const bones = [
      ['nose', 'left_eye'],
      ['nose', 'right_eye'],
      ['left_eye', 'left_ear'],
      ['right_eye', 'right_ear'],
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_elbow'],
      ['left_elbow', 'left_wrist'],
      ['right_shoulder', 'right_elbow'],
      ['right_elbow', 'right_wrist'],
      ['left_shoulder', 'left_hip'],
      ['right_shoulder', 'right_hip'],
      ['left_hip', 'right_hip'],
      ['left_hip', 'left_knee'],
      ['left_knee', 'left_ankle'],
      ['right_hip', 'right_knee'],
      ['right_knee', 'right_ankle']
    ];
    
    return { joints, bones };
  }

  createPreciseAnimations(bodyParts) {
    return {
      blink: {
        layers: ['left_eye', 'right_eye'],
        keyframes: [
          { time: 0, scaleY: 1 },
          { time: 0.1, scaleY: 0.05 },
          { time: 0.2, scaleY: 1 }
        ],
        duration: 200
      },
      smile: {
        layers: ['mouth'],
        keyframes: [
          { time: 0, scaleX: 1, scaleY: 1 },
          { time: 0.5, scaleX: 1.2, scaleY: 0.9 },
          { time: 1, scaleX: 1, scaleY: 1 }
        ],
        duration: 600
      },
      wave: {
        layers: ['right_arm'],
        keyframes: [
          { time: 0, rotate: 0 },
          { time: 0.25, rotate: -45 },
          { time: 0.5, rotate: -30 },
          { time: 0.75, rotate: -45 },
          { time: 1, rotate: 0 }
        ],
        duration: 1000,
        origin: bodyParts.right_arm ? 
          { x: bodyParts.right_arm.joints[0].x, y: bodyParts.right_arm.joints[0].y } : 
          null
      },
      headTurn: {
        layers: ['head', 'left_eye', 'right_eye', 'mouth'],
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

export default PreciseBodyTracer;
