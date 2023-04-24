import { UploadRawFile, UploadFile } from './file';
type Awaitble<T> = T | Promise<T>;
export type UploaderOption = FileOption & UploadOption & EventHandler;
export interface FileOption {
    accept: string;
    multiple: boolean;
    directoryMode: boolean;
    chunkSize: number;
}
export interface UploadOption {
    target: string;
    mergeTarget: string;
    precheckTarget: string;
    concurrency: number;
    headers: Record<string, string>;
    withCredentials: boolean;
    retryCount: number;
    progressCallbacksInterval: number;
    successCodes: number[];
    skipCodes: number[];
    failCodes: number[];
    data?: (uploadFile: Readonly<UploadRawFile>) => Record<string, string | number>;
    mergeData?: (uploadFile: Readonly<UploadRawFile>) => Record<string, any>;
    precheckData?: (uploadFile: Readonly<UploadRawFile>) => Record<string, any>;
}
export interface DragHandler {
    onDragEnter?: (event: DragEvent) => void;
    onDragOver?: (event: DragEvent) => void;
    onDragLeave?: (event: DragEvent) => void;
}
export interface FileHandler {
    onFileAdded?: (file: File) => Awaitble<boolean | void>;
    onFileReady?: (file: UploadFile) => Awaitble<void>;
    onFileRemoved?: (file: UploadFile) => void;
}
export interface UploadHandler {
    onFileStart?: (file: UploadFile) => void;
    onFileProgress?: (file: UploadFile) => void;
    onFilePause?: (file: UploadFile) => void;
    onFileCancel?: (file: UploadFile) => void;
    onFileComplete?: (file: UploadFile) => void;
    onFileSuccess?: (file: UploadFile) => void;
    onFileFail?: (file: UploadFile, error: Error) => void;
}
export type EventHandler = DragHandler & FileHandler & UploadHandler;
export declare const defaultOption: UploaderOption;
export {};
