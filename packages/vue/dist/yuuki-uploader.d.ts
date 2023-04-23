import { ComputedRef, Ref } from 'vue';
import { UploadRawFile, Option } from '@yuuki-uploader/core';

type UploadStatus = 'calculating' | 'waiting' | 'uploading' | 'compelete' | 'pause' | 'success' | 'fail';
interface UploadFile {
    uid: number;
    name: string;
    size: number;
    type: string;
    progress: number;
    currentSpeed: number;
    averageSpeed: number;
    status: UploadStatus;
    raw: UploadRawFile;
}
interface Uploader {
    uploadList: ComputedRef<UploadFile[]>;
    addFile: (rawFile: File) => Promise<void>;
    addFileList: (fileList: File[]) => Promise<void>;
    removeFile: (uploadFile: UploadFile) => void;
    register: (element: Ref<HTMLElement | undefined>) => void;
    registerDrop: (element: Ref<HTMLElement | undefined>) => void;
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
type UploaderOption = Option<UploadFile>;
declare const useUploader: (uploaderOption?: Partial<UploaderOption>) => Uploader;

export { UploadFile, UploadStatus, Uploader, UploaderOption, useUploader };
