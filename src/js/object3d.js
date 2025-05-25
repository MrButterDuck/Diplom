import * as THREE from 'three';
import {
  getSmoothedGesture,
  getSmoothedHandPosition,
  getSmoothedFingerTip,
  getSmoothedOrientation
} from './buffers.js';

let scene, camera, renderer;
let cube = null;

let isGrabbing = false;
let canGrab = false;

const grabThreshold = 0.03; // Допустимая дистанция между кубом и пальцами для захвата

// === Инициализация 3D сцены ===
export function init3D(canvas) {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  animate();
}

// === Главный цикл отрисовки ===
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// === Обновление сцены в зависимости от жестов и позиции руки ===
export function update3DState() {
  const gesture = getSmoothedGesture();
  const pinchPos = getSmoothedFingerTip();

  // Создание куба при указательном жесте
  if (gesture === 'point' && !cube && pinchPos) {
    spawnCubeAtFinger(pinchPos);
    return;
  }

  if (!cube) return;

  // Обработка захвата куба
  if (gesture === 'grab' && pinchPos) {
    const pinchVec = screenToWorld(pinchPos);

    const distToCube = cube.position.distanceTo(pinchVec);

    if (!isGrabbing && distToCube < grabThreshold) {
      canGrab = true;
    }

    if (canGrab) {
      isGrabbing = true;
      moveCubeTo(pinchVec);
      rotateCubeWithHand();
    }
  } else {
    resetGrabState();
  }
}

// === Перевод координат с экрана в 3D-пространство ===
function screenToWorld(screenPos) {
  const screenVec = new THREE.Vector3(
    (screenPos.x / window.innerWidth) * 2 - 1,
    -(screenPos.y / window.innerHeight) * 2 + 1,
    0.5
  );
  screenVec.unproject(camera);
  return screenVec;
}

// === Создание нового куба ===
function spawnCubeAtFinger(fingerPos) {
  const geometry = new THREE.BoxGeometry(0.03, 0.03, 0.03);
  const material = new THREE.MeshNormalMaterial();
  cube = new THREE.Mesh(geometry, material);

  const worldPos = screenToWorld(fingerPos);
  cube.position.copy(worldPos);

  scene.add(cube);
}

// === Перемещение куба за рукой ===
function moveCubeTo(targetVec) {
  const hand = getSmoothedHandPosition();
  if (hand) {
    // Необязательное использование глубины
    const z = THREE.MathUtils.clamp(5 + hand.z * 5, 4, 6);
    // targetVec.z = z; // если хочешь двигать по Z
  }

  cube.position.lerp(targetVec, 0.6);
}

// === Вращение куба на основе ориентации руки ===
function rotateCubeWithHand() {
  const { roll, pitch } = getSmoothedOrientation();

  cube.rotation.x = THREE.MathUtils.degToRad(pitch); // вверх/вниз
  cube.rotation.z = THREE.MathUtils.degToRad(roll);  // наклон кисти
}

// === Сброс состояния захвата ===
function resetGrabState() {
  isGrabbing = false;
  canGrab = false;
}

// === Обработка изменения размеров окна ===
export function resize3D() {
  if (!camera || !renderer) return;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
