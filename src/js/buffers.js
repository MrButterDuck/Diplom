const rollBuffer = [];
const pitchBuffer = [];
const ORIENTATION_BUFFER_SIZE = 5;

const gestureBuffer = [];
const GESTURE_BUFFER_SIZE = 10;

export function updateOrientationBuffer(raw) {
  if (!raw) return { roll: 0, pitch: 0 };

  rollBuffer.push(raw.roll);
  pitchBuffer.push(raw.pitch);

  if (rollBuffer.length > ORIENTATION_BUFFER_SIZE) rollBuffer.shift();
  if (pitchBuffer.length > ORIENTATION_BUFFER_SIZE) pitchBuffer.shift();

  const roll = rollBuffer.reduce((a, b) => a + b, 0) / rollBuffer.length;
  const pitch = pitchBuffer.reduce((a, b) => a + b, 0) / pitchBuffer.length;

  return { roll, pitch };
}

export function updateGestureBuffer(newGesture) {
  if (gestureBuffer.length >= GESTURE_BUFFER_SIZE) gestureBuffer.shift();
  gestureBuffer.push(newGesture);

  const counts = gestureBuffer.reduce((acc, g) => {
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});
  const mostFrequent = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  return mostFrequent;
}
