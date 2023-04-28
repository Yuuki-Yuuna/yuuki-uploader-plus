import { RefObject } from 'react';
import { UploadFile, UploaderOption } from 'yuuki-uploader-core';
export { UploadFile, UploadStatus } from 'yuuki-uploader-core';

interface Uploader {
    uploadList: UploadFile[];
    addFile: (rawFile: File) => Promise<void>;
    addFileList: (fileList: File[]) => Promise<void>;
    removeFile: (uploadFile: UploadFile) => void;
    register: (element: RefObject<HTMLElement>) => void;
    registerDrop: (element: RefObject<HTMLElement>) => void;
    unRegister: () => void;
    unRegisterDrop: () => void;
    upload: (uploadFile: UploadFile) => void;
    pause: (uploadFile: UploadFile) => void;
    cancel: (uploadFile: UploadFile) => void;
    resume: (uploadFile: UploadFile) => void;
    uploadAll: () => void;
    pauseAll: () => void;
    cancelAll: () => void;
}
declare const useUploader: (uploaderOption?: Partial<UploaderOption>) => Uploader;

export { Uploader, useUploader };
