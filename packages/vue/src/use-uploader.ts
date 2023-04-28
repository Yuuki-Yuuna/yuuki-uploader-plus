import { computed, reactive, ComputedRef, Ref } from 'vue'
import {
  defaultOption,
  calculateFile,
  createRequestList,
  UploaderOption,
  RequestOption,
  UploadRawFile,
  UploadFile,
  UploadStatus
} from 'yuuki-uploader-core'
import { useInput } from './use-input'

export interface Uploader {
  uploadList: ComputedRef<UploadFile[]>
  addFile: (rawFile: File) => Promise<void>
  addFileList: (fileList: File[]) => Promise<void>
  removeFile: (uploadFile: UploadFile) => void
  register: (element: Ref<HTMLElement | undefined>) => void
  registerDrop: (element: Ref<HTMLElement | undefined>) => void
  unRegister: () => void
  unRegisterDrop: () => void
  upload: (uploadFile: UploadFile) => void
  pause: (uploadFile: UploadFile) => void
  cancel: (uploadFile: UploadFile) => void
  resume: (uploadFile: UploadFile) => void
  uploadAll: () => void
  pauseAll: () => void
  cancelAll: () => void
}

export const useUploader = (uploaderOption?: Partial<UploaderOption>): Uploader => {
  const option: UploaderOption = { ...defaultOption, ...uploaderOption }
  const uploadList: UploadFile[] = reactive([])
  const {
    onFileAdded,
    onFileReady,
    onFileRemoved,
    onFileStart,
    onFileProgress,
    onFileComplete,
    onFilePause,
    onFileCancel,
    onFileSuccess,
    onFileFail
  } = option

  //实现响应式的核心方法
  const getFile = (rawFile: UploadRawFile) => uploadList.find((file) => file.uid === rawFile.uid)

  const addFile = async (file: File) => {
    const result = (await onFileAdded?.(file)) ?? true
    if (!result) {
      return
    }
    const { name, size, type } = file
    const rawFile = new UploadRawFile(file)
    uploadList.push({
      uid: rawFile.uid,
      progress: 0,
      averageSpeed: 0,
      currentSpeed: 0,
      status: 'calculating',
      raw: rawFile,
      name,
      size,
      type
    })
    const uploadFile = getFile(rawFile)! //我们需要获得proxy代理对象实现响应式
    try {
      await calculateFile(option, rawFile)
      uploadFile.status = 'waiting'
      onFileReady?.(uploadFile)
    } catch {
      throw new Error('something wrong when file chunk is calculated.')
    }
  }

  const addFileList = async (fileList: File[]) => {
    for (const file of fileList) {
      await addFile(file)
    }
  }

  const removeFile = (uploadFile: UploadFile) => {
    const index = uploadList.findIndex((item) => item.uid === uploadFile.uid)
    const canRemove = (['waiting', 'success', 'fail'] as UploadStatus[]).includes(uploadFile.status)
    if (canRemove && index !== -1) {
      uploadList.splice(index, 1)
      onFileRemoved?.(uploadFile) //返回普通对象
    }
  }

  const { register, unRegister, registerDrop, unRegisterDrop } = useInput(option, addFileList)

  const requestOption: RequestOption = {
    ...option,
    onStart: (rawFile) => {
      const uploadFile = getFile(rawFile)
      if (!uploadFile) {
        return
      }
      uploadFile.status = 'uploading'
      onFileStart?.(uploadFile)
    },
    onProgress: (rawFile) => {
      const uploadFile = getFile(rawFile)
      if (!uploadFile) {
        return
      }
      uploadFile.status = 'uploading'
      uploadFile.averageSpeed = rawFile.averageSpeed
      uploadFile.currentSpeed = rawFile.currentSpeed
      uploadFile.progress = parseFloat((rawFile.progress * 100).toFixed(1))
      onFileProgress?.(uploadFile)
    },
    onPause: (rawFile) => {
      const uploadFile = getFile(rawFile)
      if (!uploadFile) {
        return
      }
      uploadFile.status = 'pause'
      onFilePause?.(uploadFile)
    },
    onCancel: (rawFile) => {
      const index = uploadList.findIndex((item) => item.uid === rawFile.uid)
      if (index !== -1) {
        const uploadFile = uploadList[index]
        uploadFile.status = 'pause'
        uploadList.splice(index, 1)
        onFileCancel?.(uploadFile)
      }
    },
    onComplete: (rawFile) => {
      const uploadFile = getFile(rawFile)
      if (!uploadFile) {
        return
      }
      uploadFile.status = 'compelete'
      onFileComplete?.(uploadFile)
    },
    onSuccess: (rawFile) => {
      const uploadFile = getFile(rawFile)
      if (!uploadFile) {
        return
      }
      uploadFile.status = 'success'
      onFileSuccess?.(uploadFile)
    },
    onFail: (rawFile, error) => {
      const uploadFile = getFile(rawFile)
      if (!uploadFile) {
        return
      }
      uploadFile.status = 'fail'
      onFileFail?.(uploadFile, error)
    }
  }

  const { uploadRequest, clearRequest } = createRequestList(requestOption)

  const upload = (uploadFile: UploadFile) => {
    if (uploadFile.status === 'waiting') {
      uploadRequest(uploadFile.raw)
    }
  }

  const uploadAll = () => {
    uploadList.filter((item) => item.status === 'waiting').forEach((file) => upload(file))
  }

  const pause = (uploadFile: UploadFile) => {
    if (uploadFile.status === 'uploading') {
      clearRequest(uploadFile.raw)
    }
  }

  const pauseAll = () => {
    uploadList.filter((item) => item.status === 'uploading').forEach((file) => pause(file))
  }

  const cancel = (uploadFile: UploadFile) => {
    if ((['uploading', 'pause', 'compelete'] as UploadStatus[]).includes(uploadFile.status)) {
      clearRequest(uploadFile.raw, true)
    }
  }

  const cancelAll = () => {
    uploadList.filter((item) => item.status === 'uploading').forEach((file) => cancel(file))
  }

  const resume = (uploadFile: UploadFile) => {
    if (uploadFile.status === 'pause') {
      uploadRequest(uploadFile.raw, true)
    }
  }

  return {
    uploadList: computed(() => uploadList),
    addFile,
    addFileList,
    removeFile,
    register,
    unRegister,
    registerDrop,
    unRegisterDrop,
    upload,
    pause,
    cancel,
    resume,
    uploadAll,
    pauseAll,
    cancelAll
  }
}

export type { UploadFile, UploadStatus }
