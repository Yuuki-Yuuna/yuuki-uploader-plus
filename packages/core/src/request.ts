import { UploadOption } from './option'
import { UploadRawFile, Chunk, TestChunk, FileInformation } from './file'

interface UploadRequest {
  uploadFile: UploadRawFile
  current: number
  start: () => Promise<RequestResult>
}

interface RequestHandler {
  onStart: (file: UploadRawFile) => void
  onProgress: (file: UploadRawFile) => void
  onPause: (file: UploadRawFile) => void
  onCancel: (file: UploadRawFile) => void
  onComplete: (file: UploadRawFile) => void
  onSuccess: (file: UploadRawFile) => void
  onFail: (file: UploadRawFile, error: Error) => void
}

type LoadHandler = (
  resolve: (value: RequestResult | PromiseLike<RequestResult>) => void,
  retrySend: () => void
) => () => void

interface StartOption {
  uploadFile: UploadRawFile
  xhr: XMLHttpRequest
  send: () => void
  loadHandler: LoadHandler
}

enum RequestResult {
  precheck, //需要上传
  test, //需要上传
  skip,
  real,
  success,
  fail,
  abort
}

export type RequestOption = UploadOption & RequestHandler

const requestMap = new WeakMap<UploadRawFile, XMLHttpRequest[]>() //用于终止请求和统计请求
const requestMapAdd = (uploadFile: UploadRawFile, xhr: XMLHttpRequest) => {
  if (!requestMap.has(uploadFile)) {
    requestMap.set(uploadFile, [])
  }
  const xhrs = requestMap.get(uploadFile)!
  xhrs.push(xhr)
}
const requestMapRemove = (uploadFile: UploadRawFile, xhr: XMLHttpRequest) => {
  const xhrs = requestMap.get(uploadFile)
  if (xhrs) {
    requestMap.set(
      uploadFile,
      xhrs.filter((item) => item !== xhr)
    )
  }
}

export const createRequestList = (option: RequestOption) => {
  const { onStart, onPause, onCancel, onComplete, onProgress, onSuccess, onFail } = option
  let requestList: UploadRequest[] = []
  let currentRequest = 0

  const addRequest = (request: UploadRequest) => {
    requestList.push(request)
    requestNext()
  }

  const clearRequest = (uploadFile: UploadRawFile, cancel: boolean) => {
    requestList = requestList.filter((item) => item.uploadFile !== uploadFile)
    requestMap.get(uploadFile)?.forEach((xhr) => xhr.abort())
    requestMap.delete(uploadFile)
    uploadFile.chunksLoaded = new Array(uploadFile.chunks.length).fill(0)
    uploadFile.averageSpeed = 0
    uploadFile.currentSpeed = 0
    cancel ? onCancel(uploadFile) : onPause(uploadFile)
  }

  const uploadRequest = async (uploadFile: UploadRawFile, resume: boolean = false) => {
    uploadFile.lastTimestamp = Date.now()
    onStart(uploadFile)
    if (resume) {
      for (let current = 0; current < uploadFile.chunks.length; current++) {
        addRequest(createTestRequest(option, uploadFile, current))
      }
    } else {
      addRequest(createPrecheckRequest(option, uploadFile))
    }
  }

  const requestNext = () => {
    const { concurrency, progressCallbacksInterval } = option
    while (currentRequest < concurrency && requestList.length) {
      currentRequest++
      const uploadRequest = requestList.shift()!
      const { uploadFile, current, start } = uploadRequest
      start().then((result) => {
        switch (result) {
          case RequestResult.precheck:
            for (let current = 0; current < uploadFile.chunks.length; current++) {
              addRequest(createTestRequest(option, uploadFile, current))
            }
            break
          case RequestResult.test:
            addRequest(createRealRequest(option, uploadFile, current))
            break
          case RequestResult.skip:
          case RequestResult.real:
            if (uploadFile.isCompleted) {
              onComplete(uploadFile)
              addRequest(createMergeRequest(option, uploadFile))
            }
            break
          case RequestResult.success:
            // 过快更新进度
            if (Date.now() - uploadFile.lastTimestamp < progressCallbacksInterval) {
              uploadFile.chunksLoaded = uploadFile.chunks.map(chunk => chunk.currentSize)
              uploadFile.updateProgress()
              onProgress(uploadFile)
            }
            onSuccess(uploadFile)
            break
          case RequestResult.fail:
            clearRequest(uploadFile, false)
            onFail(uploadFile, new Error('there is a file failed when upload'))
        }

        currentRequest--
        if (requestList.length) {
          requestNext()
        }
      })
    }
  }

  return {
    uploadRequest,
    clearRequest
  }
}

const createTestRequest = (
  option: RequestOption,
  uploadFile: UploadRawFile,
  current: number
): UploadRequest => {
  const {
    target,
    headers,
    withCredentials,
    data,
    successCodes,
    skipCodes,
    failCodes,
    progressCallbacksInterval,
    onProgress
  } = option
  const checkInterval = () => Date.now() - uploadFile.lastTimestamp >= progressCallbacksInterval
  const xhr = new XMLHttpRequest()
  xhr.withCredentials = withCredentials

  const testChunk: TestChunk = { ...uploadFile.chunks[current] }
  Reflect.deleteProperty(testChunk, 'file')

  const params = new URLSearchParams()
  for (const key in testChunk) {
    params.append(key, testChunk[key as keyof TestChunk].toString())
  }
  const extra = data?.(uploadFile) ?? {}
  Object.keys(extra).forEach((key) => params.append(key, extra[key].toString()))

  const send = () => {
    xhr.open('get', `${target}?${params.toString()}`)
    Object.keys(headers).forEach((key) => xhr.setRequestHeader(key, headers[key]))
    xhr.send()
  }
  const loadHandler: LoadHandler = (resolve, retrySend) => {
    return () => {
      if (successCodes.includes(xhr.status)) {
        resolve(RequestResult.test)
      } else if (skipCodes.includes(xhr.status)) {
        const { chunks, chunksLoaded, updateProgress } = uploadFile
        chunksLoaded[current] = chunks[current].currentSize
        if (checkInterval()) {
          updateProgress()
          onProgress(uploadFile)
        }
        resolve(RequestResult.skip)
      } else if (failCodes.includes(xhr.status)) {
        resolve(RequestResult.fail)
      } else {
        retrySend()
      }
    }
  }

  return {
    uploadFile,
    current,
    start: createStart(option, {
      xhr,
      uploadFile,
      loadHandler,
      send
    })
  }
}

const createRealRequest = (
  option: RequestOption,
  uploadFile: UploadRawFile,
  current: number
): UploadRequest => {
  const {
    target,
    headers,
    withCredentials,
    data,
    successCodes,
    failCodes,
    progressCallbacksInterval,
    onProgress
  } = option
  const checkInterval = () => Date.now() - uploadFile.lastTimestamp >= progressCallbacksInterval
  const xhr = new XMLHttpRequest()
  xhr.withCredentials = withCredentials
  xhr.upload.addEventListener('progress', (event) => {
    const { chunks, chunksLoaded } = uploadFile
    chunksLoaded[current] = (event.loaded / event.total) * chunks[current].currentSize
    if (checkInterval()) {
      uploadFile.updateProgress()
      onProgress(uploadFile)
    }
  })

  const chunk = uploadFile.chunks[current]
  const formData = new FormData()
  for (const key in chunk) {
    let value = chunk[key as keyof Chunk]
    if (typeof value === 'number') {
      value = value.toString()
    }
    formData.append(key, value)
  }
  const extra = data?.(uploadFile) ?? {}
  Object.keys(extra).forEach((key) => formData.append(key, extra[key].toString()))

  const send = () => {
    xhr.open('post', target)
    Object.keys(headers).forEach((key) => xhr.setRequestHeader(key, headers[key]))
    xhr.send(formData)
  }
  const loadHandler: LoadHandler = (resolve, retrySend) => {
    return () => {
      if (successCodes.includes(xhr.status)) {
        resolve(RequestResult.real)
      } else if (failCodes.includes(xhr.status)) {
        resolve(RequestResult.fail)
      } else {
        retrySend()
      }
    }
  }

  return {
    uploadFile,
    current,
    start: createStart(option, {
      xhr,
      uploadFile,
      loadHandler,
      send
    })
  }
}

const createMergeRequest = (option: RequestOption, uploadFile: UploadRawFile): UploadRequest => {
  const { mergeTarget, headers, withCredentials, mergeData, successCodes, failCodes } = option
  const xhr = new XMLHttpRequest()
  xhr.withCredentials = withCredentials

  const chunk = { ...uploadFile.chunks[0] }
  Reflect.deleteProperty(chunk, 'file')
  Reflect.deleteProperty(chunk, 'chunkIndex')
  const data: FileInformation & Record<string, any> = {
    ...chunk,
    ...mergeData?.(uploadFile)
  }

  const send = () => {
    xhr.open('post', mergeTarget)
    Object.keys(headers).forEach((key) => xhr.setRequestHeader(key, headers[key]))
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(JSON.stringify(data))
  }
  const loadHandler: LoadHandler = (resolve, retrySend) => {
    return () => {
      if (successCodes.includes(xhr.status)) {
        resolve(RequestResult.success)
      } else if (failCodes.includes(xhr.status)) {
        resolve(RequestResult.fail)
      } else {
        retrySend()
      }
    }
  }

  return {
    uploadFile,
    current: -1,
    start: createStart(option, {
      xhr,
      uploadFile,
      loadHandler,
      send
    })
  }
}

const createPrecheckRequest = (option: RequestOption, uploadFile: UploadRawFile): UploadRequest => {
  const {
    precheckTarget,
    headers,
    withCredentials,
    precheckData,
    successCodes,
    skipCodes,
    failCodes
  } = option
  const xhr = new XMLHttpRequest()
  xhr.withCredentials = withCredentials

  const chunk = { ...uploadFile.chunks[0] }
  Reflect.deleteProperty(chunk, 'file')
  Reflect.deleteProperty(chunk, 'chunkIndex')
  const data: FileInformation & Record<string, any> = {
    ...chunk,
    ...precheckData?.(uploadFile)
  }

  const send = () => {
    xhr.open('post', precheckTarget)
    Object.keys(headers).forEach((key) => xhr.setRequestHeader(key, headers[key]))
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(JSON.stringify(data))
  }
  const loadHandler: LoadHandler = (resolve, retrySend) => {
    return () => {
      if (successCodes.includes(xhr.status)) {
        resolve(RequestResult.precheck)
      } else if (skipCodes.includes(xhr.status)) {
        resolve(RequestResult.success)
      } else if (failCodes.includes(xhr.status)) {
        resolve(RequestResult.fail)
      } else {
        retrySend()
      }
    }
  }

  return {
    uploadFile,
    current: -1,
    start: createStart(option, {
      xhr,
      uploadFile,
      loadHandler,
      send
    })
  }
}

const createStart = (option: RequestOption, startOption: StartOption) => {
  const { retryCount } = option
  const { xhr, uploadFile, send, loadHandler } = startOption

  return () => {
    return new Promise<RequestResult>((resolve) => {
      let retry = 0
      const retrySend = () => {
        if (retry < retryCount) {
          retry++
          send()
          requestMapAdd(uploadFile, xhr)
        } else {
          resolve(RequestResult.fail)
        }
      }

      xhr.addEventListener('load', loadHandler(resolve, retrySend))
      xhr.addEventListener('error', () => retrySend())
      xhr.addEventListener('abort', () => resolve(RequestResult.abort))
      xhr.addEventListener('loadend', () => requestMapRemove(uploadFile, xhr))

      send()
      requestMapAdd(uploadFile, xhr)
    })
  }
}
