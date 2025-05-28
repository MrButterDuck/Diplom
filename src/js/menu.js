import { settings } from "./settings.js"

import { loadModelFromURL, Models } from "./3DobjectLoader.js"

let startY = 0;
let endY = 0;
const menu = document.getElementById('bottom-menu');
const handle = document.getElementById('menu-handle');

// Поддержка касаний (мобильные)
handle.addEventListener('touchstart', (e) => {
  startY = e.touches[0].clientY;
});
handle.addEventListener('touchend', (e) => {
  endY = e.changedTouches[0].clientY;
  handleSwipe();
});

// Поддержка мыши (десктоп)
handle.addEventListener('mousedown', (e) => {
  startY = e.clientY;
});
handle.addEventListener('mouseup', (e) => {
  endY = e.clientY;
  handleSwipe();
});

function updateHandleIcon() {
  handle.textContent = menu.classList.contains('expanded') ? '▼' : '▲';
}
function handleSwipe() {
  const diff = endY - startY;
  if (Math.abs(diff) < 30) return;

  if (diff < 0) {
    menu.classList.add('expanded');
  } else {
    menu.classList.remove('expanded');
  }
  updateHandleIcon();
}

// Вкладки
document.querySelectorAll('.tab-button').forEach(button => {
button.addEventListener('click', () => {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    const tab = button.dataset.tab;
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));
    document.getElementById(tab + '-panel').classList.remove('hidden');
});
});

// Загрузка модели
document.getElementById('load-model-btn').addEventListener('click', () => {
const url = document.getElementById('model-url-input').value;
if (url) {
    console.log('Загружаем модель:', url);
    loadModelFromURL(url);
} else {
    alert("Введите ссылку на модель");
}
});

document.getElementById('clear-selection-btn').addEventListener('click', () => {
  Models.selectedModelData = null;
  document.querySelectorAll('.model-item').forEach(el => el.classList.remove('selected'));
});

// Чекбокс изменения глобального значения
document.getElementById('toggle-feature').addEventListener('change', (e) => {
    const value = e.target.checked;
    settings.isAltControl = value;
});

document.getElementById('more-info').addEventListener('change', (e) => {
    const value = e.target.checked;
    settings.moreGestureInfo = value;
});

document.getElementById('show-gesture-info').addEventListener('change', (e) => {
    const label = document.getElementById('gesture-label');
    label.style.display = e.target.checked ? 'block' : 'none';
});

document.getElementById('clear-library-btn').addEventListener('click', () => {
  if (confirm("Удалить все модели?")) {
    Models.loadedModels.length = 0;
    localStorage.removeItem('modelList');
    document.getElementById('model-library-list').innerHTML = '';
    Models.selectedModelData = null;
  }
});

document.getElementById("start-button").addEventListener("click", async () => {
const video = document.querySelector("video");

// if (!video.srcObject) {
//     try {
//     const stream = await navigator.mediaDevices.getUserMedia({
//         video: { facingMode: { exact: "environment" } }
//     });
//     // video.srcObject = stream;
//     } catch (error) {
//     alert("Не удалось получить доступ к камере: " + error.message);
//     return;
//     }
// }

// Камера уже работает — просто скрываем welcome-экран
document.getElementById("welcome-screen").style.display = "none";
});