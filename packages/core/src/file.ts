export interface FileInformation {
  totalChunks: number //总块数
  chunkSize: number //预设分块标准大小
  filename: string //文件名
  totalSize: number //总文件大小
  hash: string //文件md5
  webkitRelativePath: string //上传文件夹时文件路径
}

export interface TestChunk extends FileInformation {
  chunkIndex: number //当前块号
  currentSize: number //当前块大小
}

export interface Chunk extends TestChunk {
  file: Blob //文件流
}

// id生成算法
let fileId = 0
const genFileId = () => Date.now() + fileId++

export class UploadRawFile {
  uid: number
  file: File
  hash: string
  chunks: Chunk[]
  chunksLoaded: number[]
  progress: number
  currentSpeed: number
  averageSpeed: number
  lastTimestamp: number

  constructor(file: File) {
    this.uid = genFileId()
    this.file = file
    this.hash = ''
    this.chunks = []
    this.chunksLoaded = []
    this.progress = 0
    this.currentSpeed = 0
    this.averageSpeed = 0
    this.lastTimestamp = Date.now()
  }

  get isCompleted() {
    if (this.chunks.length && this.chunksLoaded.length) {
      const completedChunks = this.chunksLoaded.filter(
        (loaded, index) => loaded >= this.chunks[index].currentSize
      )
      return completedChunks.length === this.chunks.length
    } else {
      return false
    }
  }

  updateProgress() {
    const timestamp = Date.now()
    const delta = timestamp - this.lastTimestamp
    if (!delta) {
      return
    }
    const smoothingFactor = 0.1 //每次瞬时速度对平均速度贡献度
    const loaded = this.chunksLoaded.reduce((pre, chunkLoaded) => pre + chunkLoaded)
    const newProgress = loaded / this.file.size
    // abort可能导致负值
    const increase = Math.max((newProgress - this.progress) * this.file.size, 0)
    const currentSpeed = (increase / delta) * 1000
    this.currentSpeed = currentSpeed
    this.averageSpeed = smoothingFactor * currentSpeed + (1 - smoothingFactor) * this.averageSpeed
    this.lastTimestamp = timestamp
    this.progress = Math.max(newProgress, this.progress)
  }
}

export type UploadStatus =
  | 'calculating'
  | 'waiting'
  | 'uploading'
  | 'compelete'
  | 'pause'
  | 'success'
  | 'fail'

export interface UploadFile {
  uid: number
  name: string
  size: number
  type: string
  progress: number
  currentSpeed: number
  averageSpeed: number
  status: UploadStatus
  raw: UploadRawFile
}
