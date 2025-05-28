function getAngle(a, b, c) {
  const ab = { x: b.x - a.x, y: b.y - a.y };
  const cb = { x: b.x - c.x, y: b.y - c.y };

  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.hypot(ab.x, ab.y);
  const magCB = Math.hypot(cb.x, cb.y);

  const angleRad = Math.acos(dot / (magAB * magCB));
  return angleRad * (180 / Math.PI);
}

function getDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getFingerDirection(a, b) {
  return { x: b.x - a.x, y: b.y - a.y };
}

function angleBetweenVectors(v1, v2) {
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.hypot(v1.x, v1.y);
  const mag2 = Math.hypot(v2.x, v2.y);
  const angleRad = Math.acos(dot / (mag1 * mag2));
  return angleRad * (180 / Math.PI);
}

function fingerAngle(keypoints, joint1, joint2, joint3) {
  return getAngle(keypoints[joint1], keypoints[joint2], keypoints[joint3]);
}

export function getPalmOrientation(keypoints) {
  if (keypoints.length < 21) return { roll: 0, pitch: 0 };

  const wrist = keypoints[0];
  const indexBase = keypoints[5];
  const middleBase = keypoints[9];

  // Поворот (roll) — вектор от запястья к основанию указательного
  const rollVec = {
    x: indexBase.x - wrist.x,
    y: indexBase.y - wrist.y
  };
  const roll = Math.atan2(rollVec.y, rollVec.x) * 180 / Math.PI;

  // Наклон (pitch) — вектор от запястья к основанию среднего пальца
  const pitchVec = {
    x: middleBase.x - wrist.x,
    y: middleBase.y - wrist.y
  };
  const pitch = Math.atan2(pitchVec.y, pitchVec.x) * 180 / Math.PI;

  return { roll, pitch };
}

export function detectGesture(keypoints) {
  if (!keypoints || keypoints.length < 21) {
    return { gesture: 'none', angles: null,  avgTipDistance: null, thumbIndexAngle: null, orientation: null};
  }

  const angles = {
    thumb: fingerAngle(keypoints, 2, 3, 4),
    index: fingerAngle(keypoints, 5, 6, 8),
    middle: fingerAngle(keypoints, 9, 10, 12),
    ring: fingerAngle(keypoints, 13, 14, 16),
    pinky: fingerAngle(keypoints, 17, 18, 20),
  };

  const extended = {
    thumb: angles.thumb > 150,
    index: angles.index > 170,
    middle: angles.middle > 170,
    ring: angles.ring > 170,
    pinky: angles.pinky > 170,
  };

  const countExtended = Object.values(extended).filter(Boolean).length;

  const palm = keypoints[0];
  const tipIds = [8, 12, 16, 20];
  const distances = tipIds.map(id => getDistance(keypoints[id], palm));
  const avgTipDistance = distances.reduce((a, b) => a + b, 0) / distances.length;

  const fingerPairDistances = [
    getDistance(keypoints[8], keypoints[12]),
    getDistance(keypoints[12], keypoints[16]),
    getDistance(keypoints[16], keypoints[20]),
  ];
  const avgFingerDist = fingerPairDistances.reduce((a, b) => a + b, 0) / fingerPairDistances.length;

  const someBent = Object.values(angles).filter(a => a > 60 && a < 140).length >= 3;

  const thumbVec = getFingerDirection(keypoints[2], keypoints[4]);
  const indexVec = getFingerDirection(keypoints[5], keypoints[8]);
  const thumbIndexAngle = angleBetweenVectors(thumbVec, indexVec);

  let gesture = 'none';

  const isFist =
    angles.thumb < 165 &&
    angles.index < 30 &&
    angles.middle < 30 &&
    angles.ring < 30 &&
    angles.pinky < 30;

  const isGrab =
    angles.thumb > 160 &&
    angles.index > 130 &&
    angles.middle < 110 &&
    angles.ring < 110 &&
    angles.pinky < 110;
    thumbIndexAngle < 40;

  if (countExtended === 5 && thumbIndexAngle > 15) {
    gesture = 'open';
  } else if (isFist) {
    gesture = 'fist';
  } else if (isGrab) {
    gesture = 'grab';
  } else if (extended.index && !extended.middle && !extended.ring && !extended.pinky) {
    gesture = 'point';
  } else if (extended.index && extended.middle && !extended.ring && !extended.pinky) {
    gesture = 'vi';
  }

   const orientation = getPalmOrientation(keypoints);

  return { gesture, angles,  avgTipDistance, thumbIndexAngle, orientation };
}
