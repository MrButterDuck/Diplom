import * as THREE from 'three';

import {
  getSmoothedGesture,
  getSmoothedHandPosition,
  getSmoothedFingerTip,
  getSmoothedOrientation
} from './buffers.js';

import { settings, updateFPS } from "./settings.js"

import { Models, loadSavedModels } from "./3DobjectLoader.js"

let scene, camera, renderer;
let cube = null;

let isGrabbing = false;
let canGrab = false;

let wasFist = false;

const grabThreshold = 0.03;

export function init3D(canvas) {
  loadSavedModels()
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

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  updateFPS()
}

export function update3DState() {
  const gesture = getSmoothedGesture();
  const pinchPos = getSmoothedFingerTip();

  // === ✅ Создание куба при жесте "fist"
  if (gesture === 'fist' && pinchPos) {
    if (!wasFist) {
      if (!cube) {
        spawnObjectAtFinger(pinchPos);
      } else {
        scene.remove(cube);
        cube.geometry?.dispose?.();
        cube.material?.dispose?.();
        cube = null;
      }
      wasFist = true;
    }
    return;
  } else {
    wasFist = false; // сброс флага, когда кулак отпущен
  }

  if (!cube) return;

  if (settings.isAltControl) {
    //Стандартный режим
    if (gesture === 'grab' && pinchPos) {
      const pinchVec = screenToWorld(pinchPos);
      const distToCube = cube.position.distanceTo(pinchVec);

      if (!isGrabbing && distToCube < grabThreshold) {
        canGrab = true;
      }

      if (canGrab) {
        isGrabbing = true;
        moveCubeTo(pinchVec);
        rotateCubeWithHand(); // ориентация
      }
    } else {
      resetGrabState();
    }
  } else {
    // Альтернативный режим жестов
    if (gesture === 'point' && pinchPos) {
      const targetVec = screenToWorld(pinchPos);
      moveCubeTo(targetVec);
    }

    if (gesture === 'vi') {
      rotateCubeWithHand();
    }
  }
}

function screenToWorld(screenPos) {
  const screenVec = new THREE.Vector3(
    (screenPos.x / window.innerWidth) * 2 - 1,
    -(screenPos.y / window.innerHeight) * 2 + 1,
    0.5
  );
  screenVec.unproject(camera);
  return screenVec;
}

function spawnObjectAtFinger(fingerPos) {
  const worldPos = screenToWorld(fingerPos);

  if (Models.selectedModelData) {
    const modelClone = Models.selectedModelData.object.clone();
    modelClone.position.copy(worldPos);
    modelClone.scale.set(0.05, 0.05, 0.05); // можно позже сделать настраиваемым
    scene.add(modelClone);
    cube = modelClone; // теперь управляем моделью как "кубом"
  } else {
    const geometry = new THREE.BoxGeometry(0.03, 0.03, 0.03);
    const material = new THREE.MeshNormalMaterial();
    cube = new THREE.Mesh(geometry, material);
    cube.position.copy(worldPos);
    scene.add(cube);
  }
}

function moveCubeTo(targetVec) {
  const hand = getSmoothedHandPosition();
  if (hand) {
    const z = THREE.MathUtils.clamp(5 + hand.z * (-60), 4, 5);
    //targetVec.z = z; // при необходимости
  }
  cube.position.lerp(targetVec, 0.6);
}

function rotateCubeWithHand() {
  const { roll, pitch } = getSmoothedOrientation();
  cube.rotation.x = THREE.MathUtils.degToRad(cube.rotation.x + pitch * 3);
  // cube.rotation.y = THREE.MathUtils.degToRad(yaw * 3);
  cube.rotation.z = THREE.MathUtils.degToRad(cube.rotation.z + roll * 3);
}

function resetGrabState() {
  isGrabbing = false;
  canGrab = false;
}

// === 🆕 Экспорт переключателя режима управления
export function toggleControlMode() {
  isAltControl = !isAltControl;
  console.log('Control mode switched. isAltControl:', isAltControl);
}

export function resize3D() {
  if (!camera || !renderer) return;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}



