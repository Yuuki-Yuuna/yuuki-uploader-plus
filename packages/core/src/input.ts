import { FileOption, DragHandler } from './option'

export const createInupt = (
  option: FileOption & DragHandler,
  addFileList: (fileList: File[]) => Promise<void>
) => {
  const { multiple, directoryMode, accept } = option
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = accept
  input.multiple = multiple
  input.webkitdirectory = directoryMode

  input.addEventListener('change', () => {
    if (input.files) {
      addFileList(Array.from(input.files))
    }
    input.value = ''
  })

  const { onDragEnter, onDragLeave, onDragOver } = option

  const clickTrigger = (event: MouseEvent) => {
    event.preventDefault()
    input.click()
  }
  const dragEnterTrigger = (event: DragEvent) => {
    event.preventDefault()
    onDragEnter?.(event)
  }
  const dragOverTrigger = (event: DragEvent) => {
    event.preventDefault()
    onDragOver?.(event)
  }
  const dragLeaveTrigger = (event: DragEvent) => {
    event.preventDefault()
    onDragLeave?.(event)
  }
  const dropTrigger = (event: DragEvent) => {
    event.preventDefault()
    const files = event.dataTransfer?.files
    const fileList =
      files && Array.from(files).filter((file) => (accept ? accept.includes(file.type) : true))
    if (fileList) {
      addFileList(fileList)
    }
  }

  let clickElement: HTMLElement | null = null
  let dropElement: HTMLElement | null = null

  const register = (element: HTMLElement) => {
    if (clickElement) {
      unRegister()
    }
    clickElement = element
    element.addEventListener('click', clickTrigger)
  }
  const unRegister = () => {
    clickElement?.removeEventListener('click', clickTrigger)
    clickElement = null
  }
  const registerDrop = (element: HTMLElement) => {
    if (dropElement) {
      unRegisterDrop()
    }
    dropElement = element
    element.addEventListener('dragenter', dragEnterTrigger)
    element.addEventListener('dragover', dragOverTrigger)
    element.addEventListener('dragleave', dragLeaveTrigger)
    element.addEventListener('drop', dropTrigger)
  }
  const unRegisterDrop = () => {
    dropElement?.removeEventListener('dragenter', dragEnterTrigger)
    dropElement?.removeEventListener('dragover', dragOverTrigger)
    dropElement?.removeEventListener('dragleave', dragLeaveTrigger)
    dropElement?.removeEventListener('drop', dropTrigger)
    dropElement = null
  }

  return {
    register,
    unRegister,
    registerDrop,
    unRegisterDrop
  }
}
