# Yuuki-Uploader

文件上传器，实现了文件分片上传、分片检测、断点续传等功能。

采用 hooks 设计方式，分别使用 React 和 Vue3 实现。

## 安装

使用 vue 版本运行

```bash
npm install yuuki-uploader-vue
```

使用 react 版本运行

```bash
npm install yuuki-uploader-react
```

## 基本用法

### 上传流程简述

在文件添加时，会先计算文件的 MD5 值([Spark-MD5](https://github.com/satazor/js-spark-md5)实现)，此时文件状态为`calculating`，在 MD5 值计算完成后，文件进入`waiting`状态

使用 upload 方法即可使`waiting`状态的文件其进入`uploading`状态，upload 方法调用时，首先会发送预检请求(POST 请求)，根据 http 状态码决定后续是否上传。在实际文件块上传之前，会先发送不带有文件块的测试请求(GET 请求)，同样根据 http 状态码决定是否实际上传请求(POST 请求)

所有分块上传完毕后，文件进入`complete`状态，此时发送合并请求(POST 请求)，根据 http 状态码决定上传是否成功，上传成功则进入`success`状态

文件暂停时会进入`pause`状态，使用 resume 方法恢复时，会重新发送所有的测试请求(GET 请求)，确定还未发送的文件块

上述任何一个环节出现问题，文件都会进入`fail`状态

- 默认请求成功的状态码(预检和测试请求后会实际上传): 200, 201, 202

- 默认跳过上传的状态码(预检和测试请求后不会实际上传): 204, 205, 206

- 默认上传失败的状态码(上传器终止所有与失败文件相关的请求): 400, 404, 415, 500, 501

- 其它状态码和网络错误等: 上传器会尝试重传直到达到重传次数上限

### 请求中的基本数据

所有请求都会包含文件的基本信息，如下图 FileInformation 所示

```ts
interface FileInformation {
  totalChunks: number //总块数
  chunkSize: number //预设分块标准大小
  filename: string //文件名
  totalSize: number //总文件大小
  hash: string //文件md5
  webkitRelativePath: string //上传文件夹时文件路径
}
```

分块相关的请求会携带分块相关的一些数据，如下图所示

```ts
interface TestChunk extends FileInformation {
  chunkIndex: number //当前块号
  currentSize: number //当前块大小
}

interface Chunk extends TestChunk {
  file: Blob //文件流
}
```

### Uploader 构造函数

两个版本的都通过 useUploader 函数返回一个 Uploader 对象

```ts
const useUploader = (uploaderOption?: Partial<UploaderOption>): Uploader
```

其中，Vue 版本和 React 版本在数据响应式和注册上传器方面存在一定差异，其余部分一致

Vue 版本 Uploader

```ts
export interface Uploader {
  uploadList: ComputedRef<UploadFile[]> //响应式文件列表
  register: (element: Ref<HTMLElement | undefined>) => void //将元素注册为可点击上传文件
  registerDrop: (element: Ref<HTMLElement | undefined>) => void //将元素注册为拖拽上传区域
  addFile: (rawFile: File) => Promise<void> //添加单个文件
  addFileList: (fileList: File[]) => Promise<void> //添加多个文件
  removeFile: (uploadFile: UploadFile) => void //移除单个文件
  unRegister: () => void //解除注册元素的点击上传功能
  unRegisterDrop: () => void //解除注册元素的拖拽上传功能
  upload: (uploadFile: UploadFile) => void //上传指定的文件
  pause: (uploadFile: UploadFile) => void //暂停指定的文件
  cancel: (uploadFile: UploadFile) => void //取消指定文件的上传
  resume: (uploadFile: UploadFile) => void //恢复指定文件的上传
  uploadAll: () => void //上传文件列表中所有waiting状态的文件
  pauseAll: () => void //暂停文件列表中所有uploading状态的文件
  cancelAll: () => void //取消上传所有uploading和pause状态的文件
}
```

React 版本的 Uploader

```ts
export interface Uploader {
  uploadList: UploadFile[] //响应式文件列表
  register: (element: RefObject<HTMLElement>) => void //将元素注册为可点击上传文件
  registerDrop: (element: RefObject<HTMLElement>) => void //将元素注册为拖拽上传区域
  addFile: (rawFile: File) => Promise<void> //添加单个文件
  addFileList: (fileList: File[]) => Promise<void> //添加多个文件
  removeFile: (uploadFile: UploadFile) => void //移除单个文件
  unRegister: () => void //解除注册元素的点击上传功能
  unRegisterDrop: () => void //解除注册元素的拖拽上传功能
  upload: (uploadFile: UploadFile) => void //上传指定的文件
  pause: (uploadFile: UploadFile) => void //暂停指定的文件
  cancel: (uploadFile: UploadFile) => void //取消指定文件的上传
  resume: (uploadFile: UploadFile) => void //恢复指定文件的上传
  uploadAll: () => void //上传文件列表中所有waiting状态的文件
  pauseAll: () => void //暂停文件列表中所有uploading状态的文件
  cancelAll: () => void //取消上传所有uploading和pause状态的文件
}
```

Tips: React 版本返回的 uploadList 使用 useState 实现的状态变量，你**无需维护**该属性，它会自动实现响应式更新

### UploaderOption 配置项

在初始化时，你可以通过填入不同的配置项自定义 Uploader

```ts
export interface UploaderOption {
  accept: string //接受的文件类型，与input标签的accept功能相同，默认为''
  multiple: boolean //文件多选(multiple实现)，默认为true
  directoryMode: boolean //选择文件夹上传(multiple失效)，默认为false
  chunkSize: number //分块大小(byte)，默认为2*1024*1024
  target: string //分块上传目标url，默认为'/'
  mergeTarget: string //合并请求目标url，默认为'/'
  precheckTarget: string //预检请求目标url，默认为'/'
  concurrency: number //请求最大并发数量，默认为3
  headers: Record<string, string> //自定义请求头，默认为{}
  withCredentials: boolean //是否携带凭证，默认为false
  retryCount: number //失败重试次数，默认为3
  progressCallbacksInterval: number //progress回调函数最小间隔(ms)，默认200
  successCodes: number[] //认为是上传成功的状态码(测试和预检请求后会发送实际上传请求)，默认为[200,201,202]
  skipCodes: number[] //认为是文件或分块已存在的状态码(测试和预检请求后不再发送实际上传请求)，默认为[204,205,206]
  failCodes: number[] //认为是上传失败的状态码(不会再重新发送和失败文件相关的任何请求)，默认为[400, 404, 415, 500, 501]
  data?: (uploadFile: Readonly<UploadRawFile>) => Record<string, string | number> //测试分块和上传分块请求中发送的自定义数据
  mergeData?: (uploadFile: Readonly<UploadRawFile>) => Record<string, any> //合并请求中发送的自定义数据
  precheckData?: (uploadFile: Readonly<UploadRawFile>) => Record<string, any> //预检请求中发送的自定义数据
}
```

### Uploader 监听事件

导出了 EventHandler 类型提供监听事件的定义，但使用时仍然定义在 UploaderOption 中(UploaderOption 类型**包含**了 EventHandler 类型)

```ts
export interface EventHandler {
  // 拖拽相关事件
  onDragEnter?: (event: DragEvent) => void //文件进入拖拽区域调用
  onDragOver?: (event: DragEvent) => void //文件在拖拽区域中反复调用
  onDragLeave?: (event: DragEvent) => void //文件离开拖拽区域中调用

  //文件相关事件
  onFileAdded?: (file: File) => Awaitble<boolean | void> //文件添加前调用(支持返回Promise)
  onFileReady?: (file: UploadFile) => Awaitble<void> //文件计算完成准备就绪后调用
  onFileRemoved?: (file: UploadFile) => void //文件被移除后调用
  onFileStart?: (file: UploadFile) => void //文件开始上传时调用
  onFileProgress?: (file: UploadFile) => void //文件上传中调用
  onFilePause?: (file: UploadFile) => void //文件暂停时调用
  onFileCancel?: (file: UploadFile) => void //文件被取消后调用
  onFileComplete?: (file: UploadFile) => void //文件所有分块上传成功后调用
  onFileSuccess?: (file: UploadFile) => void //文件上传成功后调用
  onFileFail?: (file: UploadFile, error: Error) => void //文件上传失败后调用
}

type Awaitble<T> = T | Promise<T>
```

### UploadFile

响应式文件列表中维护的文件的类型

```ts
export interface UploadFile {
  uid: number //文件uid
  name: string //文件名，同原生文件名
  size: number //文件大小，同原生文件大小
  type: string //文件类型，同原生文件类型
  progress: number //文件进度，0~100保留一位小数
  currentSpeed: number //文件瞬时速度(单位bytpe/s)
  averageSpeed: number //文件平均速度(单位bytpe/s)
  status: UploadStatus //文件状态
  raw: UploadRawFile //内部API使用的文件对象
}

export type UploadStatus =
  | 'calculating'
  | 'waiting'
  | 'uploading'
  | 'compelete'
  | 'pause'
  | 'success'
  | 'fail'
```

## 简单示例

源代码中提供了简单的上传示例，clone 代码并运行`pnpm install`后，可以运行`pnpm dev:vue`或`pnpm dev:react`启动 vue 示例或 react 示例，同时需要运行`pnpm dev:server`启动 node.js 示例服务。

## 作者附

写了好几个版本的，还是垃圾的没法看，路还是很漫长啊！
