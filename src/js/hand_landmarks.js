import { detectGesture } from './gestures.js';
import { updateOrientationBuffer, updateGestureBuffer } from './buffers.js';

const video = document.querySelector('video');
const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const model = handPoseDetection.SupportedModels.MediaPipeHands;
const detectorConfig = {
  runtime: 'mediapipe',
  solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
  modelType: 'lite',
};

const detector = await handPoseDetection.createDetector(model, detectorConfig);

function drawHandLandmarks(keypoints) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  const landmark_drift = 30;  
  for (let point of keypoints) {
    context.fillStyle = 'blue';
    context.beginPath();
    context.arc(point.x - landmark_drift , point.y - landmark_drift, 10, 0, 2 * Math.PI);
    context.fill();
  }

  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [0, 9], [9,10], [10,11], [11,12],
    [0,13], [13,14], [14,15], [15,16],
    [0,17], [17,18], [18,19], [19,20]
  ];

  context.strokeStyle = 'white';
  context.lineWidth = 5;
  for (let [start, end] of connections) {
    const p1 = keypoints[start];
    const p2 = keypoints[end];
    if (p1 && p2) {
      context.beginPath();
      context.moveTo(p1.x -landmark_drift, p1.y - landmark_drift);
      context.lineTo(p2.x - landmark_drift, p2.y - landmark_drift);
      context.stroke();
    }
  }
}

navigator.mediaDevices.getUserMedia({
  video: {
    width: 1920,
    height: 1080,
    facingMode: { exact: 'environment' }
  },
  audio: false
}).then(stream => {
  video.srcObject = stream;
  video.play().then(() => {
    setInterval(async () => {
      const hands = await detector.estimateHands(video);
      const label = document.getElementById('gesture-label');

      if (hands.length > 0) {
        const keypoints = hands[0].keypoints;
        drawHandLandmarks(keypoints);
        const { gesture, angles, avgTipDistance, thumbIndexAngle, orientation } = detectGesture(keypoints);
        const smoothedGesture = updateGestureBuffer(gesture); 
        const smoothOrientation = updateOrientationBuffer(orientation);
        
        let text = `Gesture: ${smoothedGesture}`;
        if (angles) {
            text += ` | thumb: ${angles.thumb.toFixed(0)}°`;
            text += ` | index: ${angles.index.toFixed(0)}°`;
            text += ` | middle: ${angles.middle.toFixed(0)}°`;
            text += ` | ring: ${angles.ring.toFixed(0)}°`;
            text += ` | pinky: ${angles.pinky.toFixed(0)}°`;
            text += ` \npalmDist: ${avgTipDistance.toFixed(0)}°`;
            text += ` | tumbIndex: ${thumbIndexAngle.toFixed(0)}°`;
        }
        if (smoothOrientation) {
            text += `\nRoll: ${smoothOrientation.roll.toFixed(0)}°, Pitch: ${smoothOrientation.pitch.toFixed(0)}°`;
        }

        label.innerText = text;
      } else {
        context.clearRect(0, 0, canvas.width, canvas.height);
        gestureBuffer.length = 0; 
        label.textContent = 'Gesture: none';
      }
    }, 50);
  });
}).catch(console.error);