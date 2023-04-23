<template>
  <transition-group class="file-list" tag="ul" name="list">
    <li class="file" v-for="file in fileList" :key="file.uid">
      <div class="file-data" :class="file.status">
        <div class="file-info">
          <el-icon :size="18"><Document /></el-icon>
          <span>{{ file.name }}</span>
        </div>
        <div v-if="removeStatus.includes(file.status)" class="file-option">
          <span v-if="file.status === 'calculating'" class="file-span file-loading">
            <el-icon><Loading /></el-icon>
          </span>
          <template v-else>
            <span v-if="file.status === 'waiting'" class="file-span" @click="upload(file)">
              <el-icon><Top /></el-icon>
            </span>
            <span class="file-span" @click="removeFile(file)">
              <el-icon><Close /></el-icon>
            </span>
          </template>
        </div>
        <div v-else class="file-option">
          <span v-if="file.status === 'pause'" class="file-span" @click="resume(file)">
            <el-icon><Top /></el-icon>
          </span>
          <span v-else-if="file.status === 'uploading'" class="file-span" @click="pause(file)">
            <el-icon><Pause /></el-icon>
          </span>
          <span class="file-span" @click="cancel(file)">
            <el-icon><Close /></el-icon>
          </span>
        </div>
      </div>
      <div v-if="!removeStatus.includes(file.status)" class="file-extra">
        <el-progress :percentage="file.progress" :stroke-width="4" :show-text="false" />
        <div class="file-status">
          <div class="file-size">
            {{ `${calFileSize((file.size * file.progress) / 100)} / ${calFileSize(file.size)}` }}
          </div>
          <div class="file-speed">{{ calFileSize(file.currentSpeed) + '/S' }}</div>
        </div>
      </div>
    </li>
  </transition-group>
</template>

<script setup lang="ts">
import { Document, Close, Loading, Top } from '@element-plus/icons-vue'
import type { Uploader, UploadFile, UploadStatus } from 'yuuki-uploader-vue'

export interface ListItemProps {
  uploader: Uploader
  fileList: UploadFile[]
}

const props = defineProps<ListItemProps>()

const { removeFile, upload, cancel, pause, resume } = props.uploader
const removeStatus: UploadStatus[] = ['calculating', 'waiting', 'success', 'fail']

const calFileSize = (size: number) => {
  const uk = 1024
  const um = 1024 ** 2
  const ug = 1024 ** 3
  if (size < uk) {
    return Math.ceil(size) + 'B'
  } else if (size >= uk && size < um) {
    return Math.ceil(size / uk) + 'K'
  } else if (size >= um && size < ug) {
    return Math.ceil(size / um) + 'M'
  } else {
    return Math.ceil(size / ug) + 'G'
  }
}
</script>
