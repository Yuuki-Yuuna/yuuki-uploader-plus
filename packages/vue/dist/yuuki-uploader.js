import { unref, reactive, computed } from 'vue';
import SparkMD5 from 'spark-md5';

const calculateFile = (option, uploadFile) => {
  return new Promise((resolve, reject) => {
    const { chunkSize } = option;
    const { name, size, webkitRelativePath } = uploadFile.file;
    const spark = new SparkMD5.ArrayBuffer();
    const chunks = [];
    const chunkNum = Math.ceil(size / chunkSize);
    let current = 0;
    const loadNext = async (idle) => {
      if (current < chunkNum && idle.timeRemaining()) {
        const start = current * chunkSize;
        const end = start + chunkSize > size ? size : start + chunkSize;
        const fileSlice = uploadFile.file.slice(start, end);
        try {
          spark.append(await fileSlice.arrayBuffer());
        } catch (error) {
          reject(error);
          return;
        }
        chunks.push({
          chunkIndex: current,
          totalChunks: chunkNum,
          chunkSize,
          currentSize: fileSlice.size,
          totalSize: size,
          filename: name,
          webkitRelativePath,
          file: fileSlice
        });
        current++;
        if (current == chunkNum) {
          const hash = spark.end();
          const readyChunks = chunks.map((chunk) => ({ ...chunk, hash }));
          uploadFile.hash = hash;
          uploadFile.chunks = readyChunks;
          uploadFile.chunksLoaded = new Array(readyChunks.length).fill(0);
          resolve(uploadFile);
          return;
        }
      }
      window.requestIdleCallback(loadNext);
    };
    window.requestIdleCallback(loadNext);
  });
};
const createInupt = (option, addFileList) => {
  const { multiple, directoryMode, accept } = option;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = accept;
  input.multiple = multiple;
  input.webkitdirectory = directoryMode;
  input.addEventListener("change", () => {
    if (input.files) {
      addFileList(Array.from(input.files));
    }
    input.value = "";
  });
  const { onDragEnter, onDragLeave, onDragOver } = option;
  const clickTrigger = (event) => {
    event.preventDefault();
    input.click();
  };
  const dragEnterTrigger = (event) => {
    event.preventDefault();
    onDragEnter?.(event);
  };
  const dragOverTrigger = (event) => {
    event.preventDefault();
    onDragOver?.(event);
  };
  const dragLeaveTrigger = (event) => {
    event.preventDefault();
    onDragLeave?.(event);
  };
  const dropTrigger = (event) => {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    const fileList = files && Array.from(files).filter((file) => accept ? accept.includes(file.type) : true);
    if (fileList) {
      addFileList(fileList);
    }
  };
  let clickElement = null;
  let dropElement = null;
  const register = (element) => {
    if (clickElement) {
      unRegister();
    }
    clickElement = element;
    element.addEventListener("click", clickTrigger);
  };
  const unRegister = () => {
    clickElement?.removeEventListener("click", clickTrigger);
    clickElement = null;
  };
  const registerDrop = (element) => {
    if (dropElement) {
      unRegisterDrop();
    }
    dropElement = element;
    element.addEventListener("dragenter", dragEnterTrigger);
    element.addEventListener("dragover", dragOverTrigger);
    element.addEventListener("dragleave", dragLeaveTrigger);
    element.addEventListener("drop", dropTrigger);
  };
  const unRegisterDrop = () => {
    dropElement?.removeEventListener("dragenter", dragEnterTrigger);
    dropElement?.removeEventListener("dragover", dragOverTrigger);
    dropElement?.removeEventListener("dragleave", dragLeaveTrigger);
    dropElement?.removeEventListener("drop", dropTrigger);
    dropElement = null;
  };
  return {
    register,
    unRegister,
    registerDrop,
    unRegisterDrop
  };
};
const requestMap = /* @__PURE__ */ new WeakMap();
const requestMapAdd = (uploadFile, xhr) => {
  if (!requestMap.has(uploadFile)) {
    requestMap.set(uploadFile, []);
  }
  const xhrs = requestMap.get(uploadFile);
  xhrs.push(xhr);
};
const requestMapRemove = (uploadFile, xhr) => {
  const xhrs = requestMap.get(uploadFile);
  if (xhrs) {
    requestMap.set(
      uploadFile,
      xhrs.filter((item) => item !== xhr)
    );
  }
};
const createRequestList = (option) => {
  const { onStart, onPause, onCancel, onComplete, onProgress, onSuccess, onFail } = option;
  let requestList = [];
  let currentRequest = 0;
  const addRequest = (request) => {
    requestList.push(request);
    requestNext();
  };
  const clearRequest = (uploadFile, cancel = false) => {
    requestList = requestList.filter((item) => item.uploadFile !== uploadFile);
    requestMap.get(uploadFile)?.forEach((xhr) => xhr.abort());
    requestMap.delete(uploadFile);
    uploadFile.chunksLoaded = new Array(uploadFile.chunks.length).fill(0);
    uploadFile.averageSpeed = 0;
    uploadFile.currentSpeed = 0;
    cancel ? onCancel(uploadFile) : onPause(uploadFile);
  };
  const uploadRequest = async (uploadFile, resume = false) => {
    uploadFile.lastTimestamp = Date.now();
    onStart(uploadFile);
    if (resume) {
      for (let current = 0; current < uploadFile.chunks.length; current++) {
        addRequest(createTestRequest(option, uploadFile, current));
      }
    } else {
      addRequest(createPrecheckRequest(option, uploadFile));
    }
  };
  const requestNext = () => {
    const { concurrency, progressCallbacksInterval } = option;
    while (currentRequest < concurrency && requestList.length) {
      currentRequest++;
      const uploadRequest2 = requestList.shift();
      const { uploadFile, current, start } = uploadRequest2;
      start().then((result) => {
        switch (result) {
          case 0:
            for (let current2 = 0; current2 < uploadFile.chunks.length; current2++) {
              addRequest(createTestRequest(option, uploadFile, current2));
            }
            break;
          case 1:
            addRequest(createRealRequest(option, uploadFile, current));
            break;
          case 2:
          case 3:
            if (uploadFile.isCompleted) {
              onComplete(uploadFile);
              addRequest(createMergeRequest(option, uploadFile));
            }
            break;
          case 4:
            if (Date.now() - uploadFile.lastTimestamp < progressCallbacksInterval) {
              uploadFile.chunksLoaded = uploadFile.chunks.map((chunk) => chunk.currentSize);
              uploadFile.updateProgress();
              onProgress(uploadFile);
            }
            onSuccess(uploadFile);
            break;
          case 5:
            clearRequest(uploadFile, false);
            onFail(uploadFile, new Error("there is a file failed when upload"));
        }
        currentRequest--;
        if (requestList.length) {
          requestNext();
        }
      });
    }
  };
  return {
    uploadRequest,
    clearRequest
  };
};
const createTestRequest = (option, uploadFile, current) => {
  const {
    target,
    headers,
    withCredentials,
    data,
    successCodes,
    skipCodes,
    failCodes,
    progressCallbacksInterval,
    onProgress
  } = option;
  const checkInterval = () => Date.now() - uploadFile.lastTimestamp >= progressCallbacksInterval;
  const xhr = new XMLHttpRequest();
  xhr.withCredentials = withCredentials;
  const testChunk = { ...uploadFile.chunks[current] };
  Reflect.deleteProperty(testChunk, "file");
  const params = new URLSearchParams();
  for (const key in testChunk) {
    params.append(key, testChunk[key].toString());
  }
  const extra = data?.(uploadFile) ?? {};
  Object.keys(extra).forEach((key) => params.append(key, extra[key].toString()));
  const send = () => {
    xhr.open("get", `${target}?${params.toString()}`);
    Object.keys(headers).forEach((key) => xhr.setRequestHeader(key, headers[key]));
    xhr.send();
  };
  const loadHandler = (resolve, retrySend) => {
    return () => {
      if (successCodes.includes(xhr.status)) {
        resolve(
          1
          /* test */
        );
      } else if (skipCodes.includes(xhr.status)) {
        const { chunks, chunksLoaded, updateProgress } = uploadFile;
        chunksLoaded[current] = chunks[current].currentSize;
        if (checkInterval()) {
          updateProgress();
          onProgress(uploadFile);
        }
        resolve(
          2
          /* skip */
        );
      } else if (failCodes.includes(xhr.status)) {
        resolve(
          5
          /* fail */
        );
      } else {
        retrySend();
      }
    };
  };
  return {
    uploadFile,
    current,
    start: createStart(option, {
      xhr,
      uploadFile,
      loadHandler,
      send
    })
  };
};
const createRealRequest = (option, uploadFile, current) => {
  const {
    target,
    headers,
    withCredentials,
    data,
    successCodes,
    failCodes,
    progressCallbacksInterval,
    onProgress
  } = option;
  const checkInterval = () => Date.now() - uploadFile.lastTimestamp >= progressCallbacksInterval;
  const xhr = new XMLHttpRequest();
  xhr.withCredentials = withCredentials;
  xhr.upload.addEventListener("progress", (event) => {
    const { chunks, chunksLoaded } = uploadFile;
    chunksLoaded[current] = event.loaded / event.total * chunks[current].currentSize;
    if (checkInterval()) {
      uploadFile.updateProgress();
      onProgress(uploadFile);
    }
  });
  const chunk = uploadFile.chunks[current];
  const formData = new FormData();
  for (const key in chunk) {
    let value = chunk[key];
    if (typeof value === "number") {
      value = value.toString();
    }
    formData.append(key, value);
  }
  const extra = data?.(uploadFile) ?? {};
  Object.keys(extra).forEach((key) => formData.append(key, extra[key].toString()));
  const send = () => {
    xhr.open("post", target);
    Object.keys(headers).forEach((key) => xhr.setRequestHeader(key, headers[key]));
    xhr.send(formData);
  };
  const loadHandler = (resolve, retrySend) => {
    return () => {
      if (successCodes.includes(xhr.status)) {
        resolve(
          3
          /* real */
        );
      } else if (failCodes.includes(xhr.status)) {
        resolve(
          5
          /* fail */
        );
      } else {
        retrySend();
      }
    };
  };
  return {
    uploadFile,
    current,
    start: createStart(option, {
      xhr,
      uploadFile,
      loadHandler,
      send
    })
  };
};
const createMergeRequest = (option, uploadFile) => {
  const { mergeTarget, headers, withCredentials, mergeData, successCodes, failCodes } = option;
  const xhr = new XMLHttpRequest();
  xhr.withCredentials = withCredentials;
  const chunk = { ...uploadFile.chunks[0] };
  Reflect.deleteProperty(chunk, "file");
  Reflect.deleteProperty(chunk, "chunkIndex");
  const data = {
    ...chunk,
    ...mergeData?.(uploadFile)
  };
  const send = () => {
    xhr.open("post", mergeTarget);
    Object.keys(headers).forEach((key) => xhr.setRequestHeader(key, headers[key]));
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(data));
  };
  const loadHandler = (resolve, retrySend) => {
    return () => {
      if (successCodes.includes(xhr.status)) {
        resolve(
          4
          /* success */
        );
      } else if (failCodes.includes(xhr.status)) {
        resolve(
          5
          /* fail */
        );
      } else {
        retrySend();
      }
    };
  };
  return {
    uploadFile,
    current: -1,
    start: createStart(option, {
      xhr,
      uploadFile,
      loadHandler,
      send
    })
  };
};
const createPrecheckRequest = (option, uploadFile) => {
  const {
    precheckTarget,
    headers,
    withCredentials,
    precheckData,
    successCodes,
    skipCodes,
    failCodes
  } = option;
  const xhr = new XMLHttpRequest();
  xhr.withCredentials = withCredentials;
  const chunk = { ...uploadFile.chunks[0] };
  Reflect.deleteProperty(chunk, "file");
  Reflect.deleteProperty(chunk, "chunkIndex");
  const data = {
    ...chunk,
    ...precheckData?.(uploadFile)
  };
  const send = () => {
    xhr.open("post", precheckTarget);
    Object.keys(headers).forEach((key) => xhr.setRequestHeader(key, headers[key]));
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(data));
  };
  const loadHandler = (resolve, retrySend) => {
    return () => {
      if (successCodes.includes(xhr.status)) {
        resolve(
          0
          /* precheck */
        );
      } else if (skipCodes.includes(xhr.status)) {
        resolve(
          4
          /* success */
        );
      } else if (failCodes.includes(xhr.status)) {
        resolve(
          5
          /* fail */
        );
      } else {
        retrySend();
      }
    };
  };
  return {
    uploadFile,
    current: -1,
    start: createStart(option, {
      xhr,
      uploadFile,
      loadHandler,
      send
    })
  };
};
const createStart = (option, startOption) => {
  const { retryCount } = option;
  const { xhr, uploadFile, send, loadHandler } = startOption;
  return () => {
    return new Promise((resolve) => {
      let retry = 0;
      const retrySend = () => {
        if (retry < retryCount) {
          retry++;
          send();
          requestMapAdd(uploadFile, xhr);
        } else {
          resolve(
            5
            /* fail */
          );
        }
      };
      xhr.addEventListener("load", loadHandler(resolve, retrySend));
      xhr.addEventListener("error", () => retrySend());
      xhr.addEventListener("abort", () => resolve(
        6
        /* abort */
      ));
      xhr.addEventListener("loadend", () => requestMapRemove(uploadFile, xhr));
      send();
      requestMapAdd(uploadFile, xhr);
    });
  };
};
const defaultOption = {
  target: "/",
  mergeTarget: "/",
  precheckTarget: "/",
  accept: "",
  multiple: true,
  directoryMode: false,
  chunkSize: 2 * 1024 * 1024,
  concurrency: 3,
  headers: {},
  withCredentials: false,
  retryCount: 3,
  progressCallbacksInterval: 200,
  successCodes: [200, 201, 202],
  skipCodes: [204, 205, 206],
  failCodes: [400, 404, 415, 500, 501]
};
let fileId = 0;
const genFileId = () => Date.now() + fileId++;
class UploadRawFile {
  uid;
  file;
  hash;
  chunks;
  chunksLoaded;
  progress;
  currentSpeed;
  averageSpeed;
  lastTimestamp;
  constructor(file) {
    this.uid = genFileId();
    this.file = file;
    this.hash = "";
    this.chunks = [];
    this.chunksLoaded = [];
    this.progress = 0;
    this.currentSpeed = 0;
    this.averageSpeed = 0;
    this.lastTimestamp = Date.now();
  }
  get isCompleted() {
    if (this.chunks.length && this.chunksLoaded.length) {
      const completedChunks = this.chunksLoaded.filter(
        (loaded, index) => loaded >= this.chunks[index].currentSize
      );
      return completedChunks.length === this.chunks.length;
    } else {
      return false;
    }
  }
  updateProgress() {
    const timestamp = Date.now();
    const delta = timestamp - this.lastTimestamp;
    if (!delta) {
      return;
    }
    const smoothingFactor = 0.1;
    const loaded = this.chunksLoaded.reduce((pre, chunkLoaded) => pre + chunkLoaded);
    const newProgress = loaded / this.file.size;
    const increase = Math.max((newProgress - this.progress) * this.file.size, 0);
    const currentSpeed = increase / delta * 1e3;
    this.currentSpeed = currentSpeed;
    this.averageSpeed = smoothingFactor * currentSpeed + (1 - smoothingFactor) * this.averageSpeed;
    this.lastTimestamp = timestamp;
    this.progress = Math.max(newProgress, this.progress);
  }
}

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
