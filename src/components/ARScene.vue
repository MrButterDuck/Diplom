<template>
  <div class="flex w-full h-screen overflow-hidden">
    <!-- Блок видеопотока -->
    <div class="w-1/3 p-2 bg-black">
      <h3 class="text-white text-center">Видео с камеры</h3>
      <video ref="cameraFeed" autoplay muted playsinline class="w-full rounded"></video>
    </div>

    <!-- AR сцена -->
    <div class="flex-1 h-full">
      <a-scene
        ref="arScene"
        embedded
        arjs="sourceType: webcam; videoTexture: true; debugUIEnabled: false;"
        vr-mode-ui="enabled: false"
        renderer="logarithmicDepthBuffer: true;"
        style="width: 100%; height: 100%;"
      >
        <a-marker preset="hiro">
          <a-box position="0 0.5 0" material="color: red;"></a-box>
        </a-marker>
        <a-entity camera></a-entity>
      </a-scene>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ARViewer',
  mounted() {
    // Ждем, пока AR.js загрузит видеопоток
    document.addEventListener("arjs-video-loaded", () => {
      const arScene = this.$refs.arScene;
      const cameraFeed = this.$refs.cameraFeed;

      // Получаем видео-элемент из сцены
      const sourceVideo = arScene?.querySelector('video');

      if (sourceVideo?.srcObject) {
        cameraFeed.srcObject = sourceVideo.srcObject;
      } else {
        // fallback на случай задержки
        setTimeout(() => {
          if (sourceVideo?.srcObject) {
            cameraFeed.srcObject = sourceVideo.srcObject;
          }
        }, 1000);
      }
    });
  }
};
</script>

<style scoped>
video {
  height: auto;
  max-height: 90vh;
}
</style>