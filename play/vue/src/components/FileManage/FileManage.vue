<template>
  <div class="file-manage">
    <el-tabs v-model="tab">
      <el-tab-pane label="等待上传" name="waiting">
        <FileList :uploader="uploader" :file-list="files" />
      </el-tab-pane>
      <el-tab-pane label="正在上传" name="uploading">
        <FileList :uploader="uploader" :file-list="uploadFiles" />
      </el-tab-pane>
      <!-- <el-tab-pane label="上传完成" name="done"> </el-tab-pane> -->
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { Uploader, UploadStatus } from 'yuuki-uploader-vue'

export interface FileManageProps {
  uploader: Uploader
}

const props = defineProps<FileManageProps>()

const tab = ref<'waiting' | 'uploading'>('waiting')

const readyStatus: UploadStatus[] = ['calculating', 'waiting']

const { uploadList } = props.uploader
const files = computed(() => uploadList.value.filter((item) => readyStatus.includes(item.status)))
const uploadFiles = computed(() =>
  uploadList.value.filter((item) => !readyStatus.includes(item.status))
)
</script>

<style lang="scss">
@use './FileManage.scss';
</style>
