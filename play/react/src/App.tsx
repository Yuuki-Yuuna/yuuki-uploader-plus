import React from 'react'
import { useUploader } from 'yuuki-uploader-react'
import Upload from './components/Upload/Upload'
import FileManage from './components/FileManage/FileManage'

const App: React.FC = () => {
  const baseUrl = 'http://localhost:9000'

  const uploader = useUploader({
    target: `${baseUrl}/upload`,
    mergeTarget: `${baseUrl}/merge`,
    precheckTarget: `${baseUrl}/precheck`
    // onFileAdded: (file) => {
    //   console.log('文件添加', file)
    // },
    // onFileRemoved: (file) => {
    //   console.log('文件被移除', file)
    // },
    // onFileReady: (file) => {
    //   console.log('文件就绪', file)
    // },
    // onFileProgress: (file) => {
    //   console.log('文件上传中', file)
    // },
    // onFileStart: (file) => {
    //   console.log('上传开始', file)
    // }
    // onFileComplete: (file) => {
    //   console.log('文件分块上传完毕', file)
    // },
    // onFileSuccess: (file) => {
    //   console.log('上传成功', file)
    // },
    // onFileCancel: (file) => {
    //   console.log('上传取消', file)
    // },
    // onFilePause: (file) => {
    //   console.log('上传暂停', file)
    // },
    // onFileFail: (file) => {
    //   console.log('上传失败', file)
    // },
  })

  return (
    <div className='app-container'>
      <div className='app-container-logo'>
        <a className='logo-react' href='https://zh-hans.react.dev/' target='_blank'>
          <img src='/react.svg' width='120' alt='React Logo' />
        </a>
        <a
          className='logo-yuuki'
          href='https://github.com/Yuuki-Yuuna/yuuki-uploader'
          target='_blank'
        >
          <img src='/yuuki.png' alt='Yuuki Logo' />
        </a>
      </div>
      <h1>React + Yuuki</h1>
      <div className='app-content'>
        <Upload uploader={uploader} />
        <FileManage uploader={uploader} />
      </div>
    </div>
  )
}

export default App
