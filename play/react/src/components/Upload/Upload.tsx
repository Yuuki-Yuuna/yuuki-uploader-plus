import React, { useEffect, useRef } from 'react'
import { Uploader } from 'yuuki-uploader-react'
import './Upload.scss'
import { CloudUploadOutlined } from '@ant-design/icons'
import { Button } from 'antd'

const Upload: React.FC<UploadProps> = (props) => {
  const { register, registerDrop, unRegister, unRegisterDrop, uploadAll, cancelAll } =
    props.uploader
  const uploadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    register(uploadRef)
    registerDrop(uploadRef)

    return () => {
      unRegister()
      unRegisterDrop()
    }
  }, [])

  return (
    <div className='upload'>
      <h5>uploader</h5>
      <div className='upload-options'>
        <Button type='primary' onClick={uploadAll}>
          Start
        </Button>
        <Button onClick={cancelAll}>Cancel</Button>
      </div>
      <div ref={uploadRef} className='upload-field'>
        <CloudUploadOutlined className='icon' />
        <p>
          <i>点击区域</i>或<i>拖拽文件</i>至此处上传
        </p>
      </div>
    </div>
  )
}

export interface UploadProps {
  uploader: Uploader
}

export default Upload
