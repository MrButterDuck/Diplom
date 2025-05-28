import { detectGesture } from './gestures.js';
import { updateOrientationBuffer, updateGestureBuffer, updateHandPositionBuffer, updateFingerTipBuffer } from './buffers.js';
import { init3D, update3DState, resize3D } from './object3d.js';
import { settings } from "./settings.js"

const video = document.querySelector('video');
const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const model = handPoseDetection.SupportedModels.MediaPipeHands;
const detectorConfig = {
  runtime: 'mediapipe',
  solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
  modelType: 'full',
};

const detector = await handPoseDetection.createDetector(model, detectorConfig);

function drawHandLandmarks(keypoints) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  const landmark_drift = 30;  
  for (let point of keypoints) {
    context.fillStyle = 'blue';
    context.beginPath();
    context.arc(point.x - landmark_drift, point.y - landmark_drift, 10, 0, 2 * Math.PI);
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
      context.moveTo(p1.x - landmark_drift, p1.y - landmark_drift);
      context.lineTo(p2.x - landmark_drift, p2.y - landmark_drift);
      context.stroke();
    }
  }
}

const threeCanvas = document.createElement('canvas');
threeCanvas.style.position = 'absolute';
threeCanvas.style.top = '0';
threeCanvas.style.left = '0';
threeCanvas.style.pointerEvents = 'none';
document.body.appendChild(threeCanvas);

init3D(threeCanvas);
window.addEventListener('resize', resize3D);

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
        const wrist = hands[0].keypoints3D[8];
        const smoothHandPos = updateHandPositionBuffer({ x: wrist.x, y: wrist.y, z: wrist.z });
        updateFingerTipBuffer(keypoints[8], keypoints[4]);
        
        let text = `Gesture: ${smoothedGesture}`;
        if (settings.moreGestureInfo) {
            text += ` | thumb: ${angles.thumb.toFixed(0)}°`;
            text += ` | index: ${angles.index.toFixed(0)}°`;
            text += ` | middle: ${angles.middle.toFixed(0)}°`;
            text += ` | ring: ${angles.ring.toFixed(0)}°`;
            text += ` | pinky: ${angles.pinky.toFixed(0)}°`;
            text += ` \npalmDist: ${avgTipDistance.toFixed(0)}°`;
            text += ` | thumbIndex: ${thumbIndexAngle.toFixed(0)}°`;
            text += `\nRoll: ${smoothOrientation.roll.toFixed(0)}°, Pitch: ${smoothOrientation.pitch.toFixed(0)}°`;
            text += `\nHand Pos → x: ${smoothHandPos.x.toFixed(3)}, y: ${smoothHandPos.y.toFixed(3)}, z: ${smoothHandPos.z.toFixed(3)}`;
        }

        label.innerText = text;
      } else {
        context.clearRect(0, 0, canvas.width, canvas.height);
        gestureBuffer.length = 0; 
        label.textContent = 'Gesture: none';
      }
      update3DState();
    }, 50);
  });
}).catch(console.error);