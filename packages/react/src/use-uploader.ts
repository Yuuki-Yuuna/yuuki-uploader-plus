import { useState, RefObject, useMemo, useEffect } from 'react'
import {
  defaultOption,
  calculateFile,
  createRequestList,
  UploaderOption,
  RequestOption,
  UploadRawFile,
  UploadFile,
  UploadStatus
} from '@yuuki-uploader/core'
import { useInput } from './use-input'

export interface Uploader {
  uploadList: UploadFile[]
  addFile: (rawFile: File) => Promise<void>
  addFileList: (fileList: File[]) => Promise<void>
  removeFile: (uploadFile: UploadFile) => void
  register: (element: RefObject<HTMLElement>) => void
  registerDrop: (element: RefObject<HTMLElement>) => void
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
  const [uploadList, setUploadList] = useState<UploadFile[]>([])
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

  //在react中这个拿到的不是响应式的了
  const getFile = (rawFile: UploadRawFile) => uploadList.find((file) => file.uid === rawFile.uid)

  const addFile = async (file: File) => {
    const result = (await onFileAdded?.(file)) ?? true
    if (!result) {
      return
    }
    const { name, size, type } = file
    const rawFile = new UploadRawFile(file)
    const uploadFile: UploadFile = {
      uid: rawFile.uid,
      progress: 0,
      averageSpeed: 0,
      currentSpeed: 0,
      status: 'calculating',
      raw: rawFile,
      name,
      size,
      type
    }
    setUploadList((uploadList) => [...uploadList, uploadFile])

    try {
      await calculateFile(option, rawFile)
      uploadFile.status = 'waiting'
      setUploadList((uploadList) => [...uploadList])
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
      setUploadList(uploadList.filter((item) => item.uid !== uploadFile.uid))
      onFileRemoved?.(uploadFile)
    }
  }

  const { register, unRegister, registerDrop, unRegisterDrop } = useInput(option, addFileList)

  const requestOption: RequestOption = {
    ...option,
    onStart(rawFile) {
      const uploadFile = getFile(rawFile)
      if (!uploadFile) {
        return
      }
      uploadFile.status = 'uploading'
      setUploadList((uploadList) => [...uploadList])
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
      setUploadList((uploadList) => [...uploadList])
      onFileProgress?.(uploadFile)
    },
    onPause: (rawFile) => {
      const uploadFile = getFile(rawFile)
      if (!uploadFile) {
        return
      }
      uploadFile.status = 'pause'
      setUploadList((uploadList) => [...uploadList])
      onFilePause?.(uploadFile)
    },
    onCancel: (rawFile) => {
      const index = uploadList.findIndex((item) => item.uid === rawFile.uid)
      if (index !== -1) {
        const uploadFile = uploadList[index]
        uploadFile.status = 'pause'
        setUploadList((uploadList) => uploadList.filter((file) => file.uid !== uploadFile.uid))
        onFileCancel?.(uploadFile)
      }
    },
    onComplete: (rawFile) => {
      const uploadFile = getFile(rawFile)
      if (!uploadFile) {
        return
      }
      uploadFile.status = 'compelete'
      setUploadList((uploadList) => [...uploadList])
      onFileComplete?.(uploadFile)
    },
    onSuccess: (rawFile) => {
      const uploadFile = getFile(rawFile)
      if (!uploadFile) {
        return
      }
      uploadFile.status = 'success'
      setUploadList((uploadList) => [...uploadList])
      onFileSuccess?.(uploadFile)
    },
    onFail: (rawFile, error) => {
      const uploadFile = getFile(rawFile)
      if (!uploadFile) {
        return
      }
      uploadFile.status = 'fail'
      setUploadList((uploadList) => [...uploadList])
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
    uploadList,
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
