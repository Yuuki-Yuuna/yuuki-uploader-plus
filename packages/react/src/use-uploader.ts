import { useState, RefObject, useRef } from 'react'
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
  const listRef = useRef<UploadFile[]>([]) //随时维护一个最新的值(异步渲染这个真的逆天，无语！)
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

  //保证能够拿到最新的值
  const getFile = (rawFile: UploadRawFile) =>
    listRef.current.find((file) => file.uid === rawFile.uid)

  const addFile = async (file: File) => {
    const result = (await onFileAdded?.(file)) ?? true
    if (!result) {
      return
    }
    const { name, size, type } = file
    const rawFile = new UploadRawFile(file)
    listRef.current.push({
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
    setUploadList([...listRef.current])

    try {
      await calculateFile(option, rawFile)
      const uploadFile = getFile(rawFile)!
      uploadFile.status = 'waiting'
      setUploadList([...listRef.current])
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
    const index = listRef.current.findIndex((item) => item.uid === uploadFile.uid)
    const canRemove = (['waiting', 'success', 'fail'] as UploadStatus[]).includes(uploadFile.status)
    if (canRemove && index !== -1) {
      listRef.current.splice(index, 1)
      setUploadList([...listRef.current])
      onFileRemoved?.(uploadFile)
    }
  }

  // 防止重新渲染被替换
  const { register, unRegister, registerDrop, unRegisterDrop } = useRef(
    useInput(option, addFileList)
  ).current

  const requestOption: RequestOption = {
    ...option,
    onStart(rawFile) {
      const uploadFile = getFile(rawFile)
      if (!uploadFile) {
        return
      }
      uploadFile.status = 'uploading'
      setUploadList([...listRef.current])
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
      setUploadList([...listRef.current])
      onFileProgress?.(uploadFile)
    },
    onPause: (rawFile) => {
      const uploadFile = getFile(rawFile)
      if (!uploadFile) {
        return
      }
      uploadFile.status = 'pause'
      setUploadList([...listRef.current])
      onFilePause?.(uploadFile)
    },
    onCancel: (rawFile) => {
      const index = listRef.current.findIndex((item) => item.uid === rawFile.uid)
      if (index !== -1) {
        const uploadFile = listRef.current[index]
        uploadFile.status = 'pause'
        listRef.current.splice(index, 1)
        setUploadList([...listRef.current])
        onFileCancel?.(uploadFile)
      }
    },
    onComplete: (rawFile) => {
      const uploadFile = getFile(rawFile)
      if (!uploadFile) {
        return
      }
      uploadFile.status = 'compelete'
      setUploadList([...listRef.current])
      onFileComplete?.(uploadFile)
    },
    onSuccess: (rawFile) => {
      const uploadFile = getFile(rawFile)
      if (!uploadFile) {
        return
      }
      uploadFile.status = 'success'
      setUploadList([...listRef.current])
      onFileSuccess?.(uploadFile)
    },
    onFail: (rawFile, error) => {
      const uploadFile = getFile(rawFile)
      if (!uploadFile) {
        return
      }
      uploadFile.status = 'fail'
      setUploadList([...listRef.current])
      onFileFail?.(uploadFile, error)
    }
  }

  // 防止重新渲染被替换
  const { uploadRequest, clearRequest } = useRef(createRequestList(requestOption)).current

  const upload = (uploadFile: UploadFile) => {
    if (uploadFile.status === 'waiting') {
      uploadRequest(uploadFile.raw)
    }
  }

  const uploadAll = () => {
    listRef.current.filter((item) => item.status === 'waiting').forEach((file) => upload(file))
  }

  const pause = (uploadFile: UploadFile) => {
    if (uploadFile.status === 'uploading') {
      clearRequest(uploadFile.raw)
    }
  }

  const pauseAll = () => {
    listRef.current.filter((item) => item.status === 'uploading').forEach((file) => pause(file))
  }

  const cancel = (uploadFile: UploadFile) => {
    if ((['uploading', 'pause', 'compelete'] as UploadStatus[]).includes(uploadFile.status)) {
      clearRequest(uploadFile.raw, true)
    }
  }

  const cancelAll = () => {
    listRef.current.filter((item) => item.status === 'uploading').forEach((file) => cancel(file))
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
