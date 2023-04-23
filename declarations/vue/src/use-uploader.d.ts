import { ComputedRef, Ref } from 'vue';
import { Option, UploadRawFile } from '@yuuki-uploader/core';
export type UploadStatus = 'calculating' | 'waiting' | 'uploading' | 'compelete' | 'pause' | 'success' | 'fail';
export interface UploadFile {
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
export interface Uploader {
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
export type UploaderOption = Option<UploadFile>;
export declare const useUploader: (uploaderOption?: Partial<UploaderOption>) => Uploader;
