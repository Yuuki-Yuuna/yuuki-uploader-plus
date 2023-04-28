import { unref, Ref } from 'vue'
import { createInupt, UploaderOption } from 'yuuki-uploader-core'

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

  const register = (elementRef: Ref<HTMLElement | undefined>) => {
    const element = unref(elementRef)
    if (element) {
      rawRegister(element)
    }
  }
  const registerDrop = (elementRef: Ref<HTMLElement | undefined>) => {
    const element = unref(elementRef)
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
