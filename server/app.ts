import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import express, { Request, Response } from 'express'
import cors from 'cors'
import multer from 'multer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

const uploadDir = path.resolve(__dirname, 'upload')
const tempDir = path.resolve(uploadDir, 'temp')
const pkgPath = path.resolve(uploadDir, 'data.json')

const app = express()
export const upload = multer({ dest: tempDir })

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

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

type TestQuery = TestChunk & Record<string, string>
type UploadBody = Chunk & Record<string, string>
type MergeBody = FileInformation & Record<string, any>
type PrecheckBody = FileInformation & Record<string, any>

app.get('/upload', (request: Request<{}, {}, {}, TestQuery>, response) => {
  const { filename, chunkIndex } = request.query
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir)
  }
  const filePaths = fs.readdirSync(tempDir)
  const target = `${filename}-${chunkIndex}`
  //查找文件
  if (filePaths.some((filePath) => filePath == target)) {
    response.status(204).send()
  } else {
    response.send()
  }
})

app.post(
  '/upload',
  upload.single('file'),
  (request: Request<{}, {}, UploadBody, {}>, response: Response) => {
    const file = request.file!
    const { filename, chunkIndex } = request.body
    const newName = `${filename}-${chunkIndex}`
    fs.renameSync(file.path, path.resolve(file.destination, newName))
    response.send()
  }
)

app.post('/merge', upload.none(), (request: Request<{}, {}, MergeBody>, response: Response) => {
  const { filename, totalChunks, hash } = request.body
  const newFilename = conflictRename(filename)
  for (let i = 0; i < totalChunks; i++) {
    const target = `${filename}-${i}`
    const targetPath = path.resolve(tempDir, target)
    const buffer = fs.readFileSync(targetPath)
    fs.appendFileSync(path.resolve(uploadDir, newFilename), buffer)
    fs.rmSync(targetPath)
  }
  const pkg = require(pkgPath) as Record<string, any>
  pkg[newFilename] = hash
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, '\t') + '\n')
  response.send()
})

app.post(
  '/precheck',
  upload.none(),
  (request: Request<{}, {}, PrecheckBody>, response: Response) => {
    const { filename, hash } = request.body
    const pkg = require(pkgPath) as Record<string, any>
    if (Object.values(pkg).includes(hash)) {
      const pkgFilename = Object.keys(pkg).find((key) => pkg[key] === hash)!
      const newFilename = conflictRename(filename)
      fs.cpSync(path.resolve(uploadDir, pkgFilename), path.resolve(uploadDir, newFilename))
      pkg[newFilename] = hash
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, '\t') + '\n')
      response.status(204).send()
    } else {
      response.send()
    }
  }
)

app.listen(9000, () => {
  console.log('服务器启动: http://localhost:9000')
})

const conflictRename = (oldName: string) => {
  const pkg = require(pkgPath) as Record<string, any>
  const extname = path.extname(oldName)
  const baseName = path.basename(oldName, extname)
  let newName = baseName
  while (pkg[newName + extname]) {
    newName = baseName + Date.now()
  }
  return newName + extname
}
