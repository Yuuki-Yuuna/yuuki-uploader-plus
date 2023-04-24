<template>
  <div class="upload">
    <h5>uploader</h5>
    <div class="upload-options">
      <el-button type="primary" round size="small" @click="uploadStart">Start</el-button>
      <el-button type="info" round size="small" @click="uploadCancel">Cancel</el-button>
    </div>
    <div ref="uploadRef" class="upload-field">
      <el-icon :size="36"><upload-filled /></el-icon>
      <p><i>点击区域</i>或<i>拖拽文件</i>至此处上传</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UploadFilled } from '@element-plus/icons-vue'
import { Uploader } from 'yuuki-uploader-vue'

export interface UploadProps {
  uploader: Uploader
}

const props = defineProps<UploadProps>()

const uploadRef = ref<HTMLElement>()

const uploadStart = () => {
  props.uploader.uploadAll()
}

const uploadCancel = () => {
  props.uploader.cancelAll()
}

onMounted(() => {
  props.uploader.register(uploadRef)
  props.uploader.registerDrop(uploadRef)
})

onBeforeUnmount(() => {
  props.uploader.unRegister()
  props.uploader.unRegisterDrop()
})
</script>

<style lang="scss">
.upload {
  width: 240px;
  margin: auto;

  h5 {
    margin-bottom: 12px;
    font-style: italic;
  }

  &-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 0 12px;

    .el-button {
      width: 54px;
      height: 28px;
    }
  }

  &-field {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 240px;
    border: 1px dashed var(--el-border-color);
    border-radius: 16px;
    cursor: pointer;

    &:hover {
      border-color: var(--el-color-primary);

      .el-icon {
        color: var(--el-color-primary);
      }
    }

    p {
      color: var(--el-text-color-regular);
      font-size: 12px;

      i {
        font-style: normal;
        color: var(--el-color-primary);
      }
    }
  }
}
</style>
