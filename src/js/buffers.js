const rollBuffer = [];
const pitchBuffer = [];
const ORIENTATION_BUFFER_SIZE = 5;

const gestureBuffer = [];
const GESTURE_BUFFER_SIZE = 10;

const handPositionBuffer = [];
const HAND_BUFFER_SIZE = 5;

const fingerTipBuffer = [];
const FINGER_TIP_BUFFER_SIZE = 5;

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

export function getSmoothedOrientation() {
  if (!rollBuffer.length || !pitchBuffer.length) return { roll: 0, pitch: 0 };

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

export function getSmoothedGesture() {
  if (!gestureBuffer.length) return 'none';
  const counts = gestureBuffer.reduce((acc, g) => {
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

export function updateHandPositionBuffer(pos) {
  if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number' || typeof pos.z !== 'number') {
    return { x: 0, y: 0, z: 0 };
  }

  handPositionBuffer.push(pos);
  if (handPositionBuffer.length > HAND_BUFFER_SIZE) handPositionBuffer.shift();

  const sum = handPositionBuffer.reduce((acc, p) => {
    acc.x += p.x;
    acc.y += p.y;
    acc.z += p.z;
    return acc;
  }, { x: 0, y: 0, z: 0 });

  const len = handPositionBuffer.length;

  return {
    x: sum.x / len,
    y: sum.y / len,
    z: sum.z / len
  };
}

export function getSmoothedHandPosition() {
  if (!handPositionBuffer.length) return null;
  const len = handPositionBuffer.length;
  const sum = handPositionBuffer.reduce((acc, p) => ({
    x: acc.x + p.x,
    y: acc.y + p.y,
    z: acc.z + p.z
  }), { x: 0, y: 0, z: 0 });
  return {
    x: sum.x / len,
    y: sum.y / len,
    z: sum.z / len
  };
}


export function updateFingerTipBuffer(a, b) {
  if (!a || !b) return;

  const midpoint = {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2
  };

  fingerTipBuffer.push(midpoint);
  if (fingerTipBuffer.length > FINGER_TIP_BUFFER_SIZE) fingerTipBuffer.shift();
}

export function getSmoothedFingerTip() {
  if (!fingerTipBuffer.length) return null;
  const len = fingerTipBuffer.length;
  const sum = fingerTipBuffer.reduce((acc, p) => ({
    x: acc.x + p.x,
    y: acc.y + p.y
  }), { x: 0, y: 0 });
  return {
    x: sum.x / len,
    y: sum.y / len
  };
}
