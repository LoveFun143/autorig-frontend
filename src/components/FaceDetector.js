// src/components/FaceDetector.js
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import '@mediapipe/face_mesh';

class FaceDetector {
  constructor() {
    this.detector = null;
  }

  async detectFace(imageUrl) {
    try {
      // Load image
      const img = await this.loadImage(imageUrl);
      
      // Initialize detector if needed
      if (!this.detector) {
        console.log('Loading face detection model...');
        this.detector = await faceLandmarksDetection.createDetector(
          faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
          {
            runtime: 'mediapipe',
            solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
            refineLandmarks: true
          }
        );
      }
      
      // Detect faces
      const faces = await this.detector.estimateFaces(img);
      
      if (!faces || faces.length === 0) {
        console.log('No face detected');
        return null;
      }
      
      const face = faces[0];
      console.log(`Detected face with ${face.keypoints.length} landmarks`);
      
      // For now, just return the basic structure
      return {
        detected: true,
        numKeypoints: face.keypoints.length,
        bounds: this.calculateBounds(face.keypoints)
      };
      
    } catch (error) {
      console.error('Face detection failed:', error);
      return null;
    }
  }

  calculateBounds(keypoints) {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    keypoints.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
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

export default FaceDetector;
