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

<style lang="scss">
.file-list {
  cursor: pointer;
  list-style: none;
  max-height: 280px;
  overflow-x: hidden;
  overflow-y: auto;

  .file {
    padding: 12px;

    &:hover {
      background-color: var(--el-fill-color-light);

      .file-info {
        color: var(--el-color-primary);

        .el-icon {
          color: var(--el-color-primary);
        }
      }
    }

    &-data {
      display: flex;
      justify-content: space-between;
      align-items: center;

      &.fail {
        .file-info {
          color: var(--el-color-danger);

          .el-icon {
            color: var(--el-color-danger);
          }
        }
      }

      &.success {
        .file-info {
          color: var(--el-color-success);

          .el-icon {
            color: var(--el-color-success);
          }
        }
      }
    }

    &-info {
      display: flex;
      align-items: center;
      font-size: 14px;
      color: var(--el-text-color-regular);

      & > span {
        margin-left: 6px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        max-width: 300px;

        @media (max-width: 640px) {
          max-width: 120px;
        }
      }
    }

    &-option {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 6px;
    }

    &-span {
      display: inline-flex;
      justify-content: center;
      align-content: center;
      font-size: 20px;

      &:hover {
        .el-icon {
          color: var(--el-color-primary);
        }
      }
    }

    &-loading {
      color: var(--el-color-primary);
      animation: loading 2s linear infinite;
    }

    &-extra {
      margin-top: 10px;
    }

    &-status {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: var(--el-text-color-regular);
      padding: 6px;
    }
  }
}

.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

@keyframes loading {
  0% {
    transform: rotate(0deg);
  }

  20% {
    transform: rotate(72deg);
  }

  40% {
    transform: rotate(144deg);
  }

  60% {
    transform: rotate(216deg);
  }

  80% {
    transform: rotate(288deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
