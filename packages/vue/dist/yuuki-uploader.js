import { unref, reactive, computed } from 'vue';
import { createInupt, defaultOption, createRequestList, UploadRawFile, calculateFile } from 'yuuki-uploader-core';

const useInput = (option, addFileList) => {
  const {
    register: rawRegister,
    registerDrop: rawRegisterDrop,
    unRegister,
    unRegisterDrop
  } = createInupt(option, addFileList);
  const register = (elementRef) => {
    const element = unref(elementRef);
    if (element) {
      rawRegister(element);
    }
  };
  const registerDrop = (elementRef) => {
    const element = unref(elementRef);
    if (element) {
      rawRegisterDrop(element);
    }
  };
  return {
    register,
    unRegister,
    registerDrop,
    unRegisterDrop
  };
};

const useUploader = (uploaderOption) => {
  const option = { ...defaultOption, ...uploaderOption };
  const uploadList = reactive([]);
  const {
    onFileAdded,
    onFileReady,
    onFileRemoved,
    onFileStart,
    onFileProgress,
    onFileComplete,
    onFilePause,
    onFileCancel,
    onFileSuccess,
    onFileFail
  } = option;
  const getFile = (rawFile) => uploadList.find((file) => file.uid === rawFile.uid);
  const addFile = async (file) => {
    const result = await onFileAdded?.(file) ?? true;
    if (!result) {
      return;
    }
    const { name, size, type } = file;
    const rawFile = new UploadRawFile(file);
    uploadList.push({
      uid: rawFile.uid,
      progress: 0,
      averageSpeed: 0,
      currentSpeed: 0,
      status: "calculating",
      raw: rawFile,
      name,
      size,
      type
    });
    const uploadFile = getFile(rawFile);
    try {
      await calculateFile(option, rawFile);
      uploadFile.status = "waiting";
      onFileReady?.(uploadFile);
    } catch {
      throw new Error("something wrong when file chunk is calculated.");
    }
  };
  const addFileList = async (fileList) => {
    for (const file of fileList) {
      await addFile(file);
    }
  };
  const removeFile = (uploadFile) => {
    const index = uploadList.findIndex((item) => item.uid === uploadFile.uid);
    const canRemove = ["waiting", "success", "fail"].includes(uploadFile.status);
    if (canRemove && index !== -1) {
      uploadList.splice(index, 1);
      onFileRemoved?.(uploadFile);
    }
  };
  const { register, unRegister, registerDrop, unRegisterDrop } = useInput(option, addFileList);
  const requestOption = {
    ...option,
    onStart: (rawFile) => {
      const uploadFile = getFile(rawFile);
      if (!uploadFile) {
        return;
      }
      uploadFile.status = "uploading";
      onFileStart?.(uploadFile);
    },
    onProgress: (rawFile) => {
      const uploadFile = getFile(rawFile);
      if (!uploadFile) {
        return;
      }
      uploadFile.status = "uploading";
      uploadFile.averageSpeed = rawFile.averageSpeed;
      uploadFile.currentSpeed = rawFile.currentSpeed;
      uploadFile.progress = parseFloat((rawFile.progress * 100).toFixed(1));
      onFileProgress?.(uploadFile);
    },
    onPause: (rawFile) => {
      const uploadFile = getFile(rawFile);
      if (!uploadFile) {
        return;
      }
      uploadFile.status = "pause";
      onFilePause?.(uploadFile);
    },
    onCancel: (rawFile) => {
      const index = uploadList.findIndex((item) => item.uid === rawFile.uid);
      if (index !== -1) {
        const uploadFile = uploadList[index];
        uploadFile.status = "pause";
        uploadList.splice(index, 1);
        onFileCancel?.(uploadFile);
      }
    },
    onComplete: (rawFile) => {
      const uploadFile = getFile(rawFile);
      if (!uploadFile) {
        return;
      }
      uploadFile.status = "compelete";
      onFileComplete?.(uploadFile);
    },
    onSuccess: (rawFile) => {
      const uploadFile = getFile(rawFile);
      if (!uploadFile) {
        return;
      }
      uploadFile.status = "success";
      onFileSuccess?.(uploadFile);
    },
    onFail: (rawFile, error) => {
      const uploadFile = getFile(rawFile);
      if (!uploadFile) {
        return;
      }
      uploadFile.status = "fail";
      onFileFail?.(uploadFile, error);
    }
  };
  const { uploadRequest, clearRequest } = createRequestList(requestOption);
  const upload = (uploadFile) => {
    if (uploadFile.status === "waiting") {
      uploadRequest(uploadFile.raw);
    }
  };
  const uploadAll = () => {
    uploadList.filter((item) => item.status === "waiting").forEach((file) => upload(file));
  };
  const pause = (uploadFile) => {
    if (uploadFile.status === "uploading") {
      clearRequest(uploadFile.raw);
    }
  };
  const pauseAll = () => {
    uploadList.filter((item) => item.status === "uploading").forEach((file) => pause(file));
  };
  const cancel = (uploadFile) => {
    if (["uploading", "pause", "compelete"].includes(uploadFile.status)) {
      clearRequest(uploadFile.raw, true);
    }
  };
  const cancelAll = () => {
    uploadList.filter((item) => item.status === "uploading").forEach((file) => cancel(file));
  };
  const resume = (uploadFile) => {
    if (uploadFile.status === "pause") {
      uploadRequest(uploadFile.raw, true);
    }
  };
  return {
    uploadList: computed(() => uploadList),
    addFile,
    addFileList,
    removeFile,
    register,
    unRegister,
    registerDrop,
    unRegisterDrop,
    upload,
    pause,
    cancel,
    resume,
    uploadAll,
    pauseAll,
    cancelAll
  };
};

export { useUploader };
