<template>
  <div class="app-container">
    <div class="app-container-logo">
      <a class="logo-vue" href="https://cn.vuejs.org/" target="_blank">
        <img src="/vue.svg" width="120" alt="Vue Logo" />
      </a>
      <a class="logo-yuuki" href="https://github.com/Yuuki-Yuuna/yuuki-uploader" target="_blank">
        <img src="/yuuki.png" alt="Yuuki Logo" />
      </a>
    </div>
    <h1>Vue + Yuuki</h1>
    <div class="app-content">
      <Upload :uploader="uploader" />
      <FileManage :uploader="uploader" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUploader } from 'yuuki-uploader-vue'

const baseUrl = 'http://localhost:9000'

const uploader = shallowRef(
  useUploader({
    target: `${baseUrl}/upload`,
    mergeTarget: `${baseUrl}/merge`,
    precheckTarget: `${baseUrl}/precheck`
  })
)
</script>

<style lang="scss">
.app-container {
  max-width: 1024px;
  margin: auto;
  padding: 24px;
  text-align: center;
  overflow-x: hidden;

  .app-container-logo {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 24px;

    .logo-vue:hover {
      filter: drop-shadow(0 0 2em #42b883aa);
    }
    .logo-yuuki:hover {
      filter: drop-shadow(0 0 2em #fea499);
    }
  }

  .app-content {
    margin: auto;
    display: flex;
    flex-wrap: wrap;
    gap: 50px;

    @media (max-width: 678px) {
      flex-direction: column;
    }
  }
}
</style>
