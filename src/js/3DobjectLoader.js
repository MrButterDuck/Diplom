import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const Models = {
    loadedModels: [],
    selectedModelData: null
};

const loader = new GLTFLoader();

export function loadModelFromURL(url) {
  loader.load(url, (gltf) => {
    const model = gltf.scene;
    applyDefaultMaterialIfNeeded(model);
    model.scale.set(0.05, 0.05, 0.05);

    const modelData = {
      name: `${extractModelNameFromURL(url)}`,
      object: model,
      url: url
    };

    Models.loadedModels.push(modelData);
    addModelToLibraryUI(modelData);
    saveModelList(Models.loadedModels);
  }, undefined, (err) => {
    console.error("Ошибка загрузки модели:", err);
    alert("Не удалось загрузить модель");
  });
}

function addModelToLibraryUI(modelData) {
  const list = document.getElementById('model-library-list');
  const item = document.createElement('div');
  item.textContent = modelData.name;
  item.classList.add('model-item');

  const canvas = renderPreview(modelData.object);

  const label = document.createElement('div');
  label.textContent = modelData.name;
  label.classList.add('model-label');

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '🗑️';
  deleteBtn.classList.add('delete-btn');
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    removeModel(modelData);
    list.removeChild(item);
  });

  item.appendChild(canvas);
  item.appendChild(label);
  item.appendChild(deleteBtn);

  item.addEventListener('click', () => {
    Models.selectedModelData = modelData;
    document.querySelectorAll('.model-item').forEach(el => el.classList.remove('selected'));
    item.classList.add('selected');
  });
  list.appendChild(item);
}

function applyDefaultMaterialIfNeeded(model) {
  model.traverse((child) => {
    if (child.isMesh) {
        child.material = new THREE.MeshNormalMaterial();   
    }
  });
}

function saveModelList(models) {
  const json = JSON.stringify(models.map(m => m.url));
  localStorage.setItem('modelList', json);
}

function removeModel(modelData) {
  const index = Models.loadedModels.findIndex(m => m.url === modelData.url);
  if (index !== -1) {
    Models.loadedModels.splice(index, 1);
    saveModelList(Models.loadedModels);
  }
}

export function loadSavedModels() {
  const saved = localStorage.getItem('modelList');
  if (!saved) return;

  const urls = JSON.parse(saved);
  urls.forEach(url => {
    loader.load(url, (gltf) => {
      const model = gltf.scene;
      applyDefaultMaterialIfNeeded(model);
      model.scale.set(0.05, 0.05, 0.05);

      const name = extractModelNameFromURL(url);
      const modelData = { name, url, object: model };
      Models.loadedModels.push(modelData);
      addModelToLibraryUI(modelData);
    });
  });
}

function extractModelNameFromURL(url) {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return filename.split('.')[0];
}

function renderPreview(model) {
  const width = 100;
  const height = 100;
  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = width;
  previewCanvas.height = height;

  const previewRenderer = new THREE.WebGLRenderer({ canvas: previewCanvas, alpha: true });
//   previewRenderer.setSize(width, height);

  const previewScene = new THREE.Scene();
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 1, 2);
  previewScene.add(light);
  previewScene.add(new THREE.AmbientLight(0xffffff, 0.5));

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.z = 2;

  const cloned = model.clone(true);
  cloned.scale.set(0.7, 0.7, 0.7)
  previewScene.add(cloned);

  // Центрируем модель
  const box = new THREE.Box3().setFromObject(cloned);
  const center = new THREE.Vector3();
  box.getCenter(center);
  cloned.position.sub(center);

  previewRenderer.render(previewScene, camera);
  return previewCanvas;
}