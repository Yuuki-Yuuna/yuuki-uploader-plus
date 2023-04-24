import { RefObject } from 'react'
import { createInupt, UploaderOption } from '@yuuki-uploader/core'

export const useInput = (
  option: UploaderOption,
  addFileList: (fileList: File[]) => Promise<void>
) => {
  const {
    register: rawRegister,
    registerDrop: rawRegisterDrop,
    unRegister,
    unRegisterDrop
  } = createInupt(option, addFileList)

  const register = (elementRef: RefObject<HTMLElement>) => {
    const element = elementRef.current
    if (element) {
      rawRegister(element)
    }
  }
  const registerDrop = (elementRef: RefObject<HTMLElement>) => {
    const element = elementRef.current
    if (element) {
      rawRegisterDrop(element)
    }
  }

  return {
    register,
    unRegister,
    registerDrop,
    unRegisterDrop
  }
}
