export const settings = {
    isAltControl: false,
    moreGestureInfo: false
}

let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;

export function updateFPS() {
  const now = performance.now();
  frameCount++;

  if (now - lastFrameTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastFrameTime = now;

    const fpsDisplay = document.getElementById("fps-label");
    if (fpsDisplay) {
      fpsDisplay.textContent = `FPS: ${fps}`;
    }
  }
}