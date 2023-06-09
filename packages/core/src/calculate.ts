import SparkMD5 from 'spark-md5'
import { UploadRawFile, Chunk } from './file'
import { FileOption } from './option'

export const calculateFile = (option: FileOption, uploadFile: UploadRawFile) => {
  return new Promise<UploadRawFile>((resolve, reject) => {
    const { chunkSize } = option
    const { name, size, webkitRelativePath } = uploadFile.file
    const spark = new SparkMD5.ArrayBuffer()
    const chunks: Omit<Chunk, 'hash'>[] = [] //最后添加hash
    const chunkNum = Math.ceil(size / chunkSize)
    let current = 0

    //默认采用浏览器空闲调用模式
    const loadNext = async (idle: IdleDeadline) => {
      if (current < chunkNum && idle.timeRemaining()) {
        const start = current * chunkSize
        const end = start + chunkSize > size ? size : start + chunkSize
        const fileSlice = uploadFile.file.slice(start, end)
        try {
          spark.append(await fileSlice.arrayBuffer())
        } catch (error) {
          reject(error)
          return
        }
        chunks.push({
          chunkIndex: current,
          totalChunks: chunkNum,
          chunkSize,
          currentSize: fileSlice.size,
          totalSize: size,
          filename: name,
          webkitRelativePath,
          file: fileSlice
        })
        current++

        if (current == chunkNum) {
          const hash = spark.end()
          const readyChunks = chunks.map((chunk) => ({ ...chunk, hash })) as Chunk[]
          uploadFile.hash = hash
          uploadFile.chunks = readyChunks
          uploadFile.chunksLoaded = new Array(readyChunks.length).fill(0)
          resolve(uploadFile)
          return
        }
      }

      window.requestIdleCallback(loadNext)
    }

    window.requestIdleCallback(loadNext)
  })
}
