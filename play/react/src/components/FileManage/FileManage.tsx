import React from 'react'
import { Uploader, UploadStatus } from 'yuuki-uploader-react'
import {
  FileTextOutlined,
  LoadingOutlined,
  ArrowUpOutlined,
  CloseOutlined,
  PauseOutlined
} from '@ant-design/icons'
import QueueAnim from 'rc-queue-anim'
import { Divider, Progress } from 'antd'
import './FileManage.scss'

const FileManage: React.FC<FileManageProps> = (props) => {
  const { uploadList, upload, removeFile, resume, pause, cancel } = props.uploader
  const removeStatus: UploadStatus[] = ['calculating', 'waiting', 'success', 'fail']

  const calFileSize = (size: number) => {
    const uk = 1024
    const um = 1024 ** 2
    const ug = 1024 ** 3
    if (size < uk) {
      return Math.ceil(size) + 'B'
    } else if (size >= uk && size < um) {
      return Math.ceil(size / uk) + 'K'
    } else if (size >= um && size < ug) {
      return Math.ceil(size / um) + 'M'
    } else {
      return Math.ceil(size / ug) + 'G'
    }
  }

  return (
    <div className='file-manage'>
      <Divider children={<h4>上传列表</h4>} orientation='left' />
      <QueueAnim component='ul' className='file-list'>
        {uploadList.map((file) => (
          <li className='file' key={file.uid}>
            <div className={'file-data '+ file.status}>
              <div className='file-info'>
                <FileTextOutlined className='icon' />
                <span>{file.name}</span>
              </div>
              {removeStatus.includes(file.status) ? (
                <div className='file-option'>
                  {file.status === 'calculating' ? (
                    <LoadingOutlined className='icon' />
                  ) : (
                    <>
                      {file.status === 'waiting' ? (
                        <ArrowUpOutlined className='icon' onClick={() => upload(file)} />
                      ) : null}
                      <CloseOutlined className='icon' onClick={() => removeFile(file)} />
                    </>
                  )}
                </div>
              ) : (
                <div className='file-option'>
                  {file.status === 'pause' ? (
                    <ArrowUpOutlined className='icon' onClick={() => resume(file)} />
                  ) : file.status === 'uploading' ? (
                    <PauseOutlined className='icon' onClick={() => pause(file)} />
                  ) : null}
                  <CloseOutlined className='icon' onClick={() => cancel(file)} />
                </div>
              )}
            </div>
            {!removeStatus.includes(file.status) ? (
              <div className='file-extra'>
                <Progress
                  percent={file.progress}
                  status='active'
                  size={[560, 4]}
                  showInfo={false}
                />
                <div className='file-status'>
                  <div className='file-size'>
                    {`${calFileSize((file.size * file.progress) / 100)} / ${calFileSize(
                      file.size
                    )}`}
                  </div>
                  <div className='file-speed'>{calFileSize(file.currentSpeed) + '/S'}</div>
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </QueueAnim>
    </div>
  )
}

export interface FileManageProps {
  uploader: Uploader
}

export default FileManage
