import { useState, useRef } from 'react';
import { createInupt, defaultOption, createRequestList, UploadRawFile, calculateFile } from '@yuuki-uploader/core';

const useInput = (option, addFileList) => {
  const {
    register: rawRegister,
    registerDrop: rawRegisterDrop,
    unRegister,
    unRegisterDrop
  } = createInupt(option, addFileList);
  const register = (elementRef) => {
    const element = elementRef.current;
    if (element) {
      rawRegister(element);
    }
  };
  const registerDrop = (elementRef) => {
    const element = elementRef.current;
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
  const [uploadList, setUploadList] = useState([]);
  const listRef = useRef([]);
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
  const getFile = (rawFile) => listRef.current.find((file) => file.uid === rawFile.uid);
  const addFile = async (file) => {
    const result = await onFileAdded?.(file) ?? true;
    if (!result) {
      return;
    }
    const { name, size, type } = file;
    const rawFile = new UploadRawFile(file);
    listRef.current.push({
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
    setUploadList([...listRef.current]);
    try {
      await calculateFile(option, rawFile);
      const uploadFile = getFile(rawFile);
      uploadFile.status = "waiting";
      setUploadList([...listRef.current]);
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
    const index = listRef.current.findIndex((item) => item.uid === uploadFile.uid);
    const canRemove = ["waiting", "success", "fail"].includes(uploadFile.status);
    if (canRemove && index !== -1) {
      listRef.current.splice(index, 1);
      setUploadList([...listRef.current]);
      onFileRemoved?.(uploadFile);
    }
  };
  const { register, unRegister, registerDrop, unRegisterDrop } = useRef(
    useInput(option, addFileList)
  ).current;
  const requestOption = {
    ...option,
    onStart(rawFile) {
      const uploadFile = getFile(rawFile);
      if (!uploadFile) {
        return;
      }
      uploadFile.status = "uploading";
      setUploadList([...listRef.current]);
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
      setUploadList([...listRef.current]);
      onFileProgress?.(uploadFile);
    },
    onPause: (rawFile) => {
      const uploadFile = getFile(rawFile);
      if (!uploadFile) {
        return;
      }
      uploadFile.status = "pause";
      setUploadList([...listRef.current]);
      onFilePause?.(uploadFile);
    },
    onCancel: (rawFile) => {
      const index = listRef.current.findIndex((item) => item.uid === rawFile.uid);
      if (index !== -1) {
        const uploadFile = listRef.current[index];
        uploadFile.status = "pause";
        listRef.current.splice(index, 1);
        setUploadList([...listRef.current]);
        onFileCancel?.(uploadFile);
      }
    },
    onComplete: (rawFile) => {
      const uploadFile = getFile(rawFile);
      if (!uploadFile) {
        return;
      }
      uploadFile.status = "compelete";
      setUploadList([...listRef.current]);
      onFileComplete?.(uploadFile);
    },
    onSuccess: (rawFile) => {
      const uploadFile = getFile(rawFile);
      if (!uploadFile) {
        return;
      }
      uploadFile.status = "success";
      setUploadList([...listRef.current]);
      onFileSuccess?.(uploadFile);
    },
    onFail: (rawFile, error) => {
      const uploadFile = getFile(rawFile);
      if (!uploadFile) {
        return;
      }
      uploadFile.status = "fail";
      setUploadList([...listRef.current]);
      onFileFail?.(uploadFile, error);
    }
  };
  const { uploadRequest, clearRequest } = useRef(createRequestList(requestOption)).current;
  const upload = (uploadFile) => {
    if (uploadFile.status === "waiting") {
      uploadRequest(uploadFile.raw);
    }
  };
  const uploadAll = () => {
    listRef.current.filter((item) => item.status === "waiting").forEach((file) => upload(file));
  };
  const pause = (uploadFile) => {
    if (uploadFile.status === "uploading") {
      clearRequest(uploadFile.raw);
    }
  };
  const pauseAll = () => {
    listRef.current.filter((item) => item.status === "uploading").forEach((file) => pause(file));
  };
  const cancel = (uploadFile) => {
    if (["uploading", "pause", "compelete"].includes(uploadFile.status)) {
      clearRequest(uploadFile.raw, true);
    }
  };
  const cancelAll = () => {
    listRef.current.filter((item) => item.status === "uploading").forEach((file) => cancel(file));
  };
  const resume = (uploadFile) => {
    if (uploadFile.status === "pause") {
      uploadRequest(uploadFile.raw, true);
    }
  };
  return {
    uploadList,
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
