import { UploadRawFile } from './file';
type Awaitble<T> = T | Promise<T>;
export type Option<T = UploadRawFile> = FileOption & UploadOption & EventHandler<T>;
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
export interface FileHandler<T = UploadRawFile> {
    onFileAdded?: (file: File) => Awaitble<boolean | void>;
    onFileReady?: (file: T) => Awaitble<void>;
    onFileRemoved?: (file: T) => void;
}
export interface UploadHandler<T = UploadRawFile> {
    onFileStart?: (file: T) => void;
    onFileProgress?: (file: T) => void;
    onFilePause?: (file: T) => void;
    onFileCancel?: (file: T) => void;
    onFileComplete?: (file: T) => void;
    onFileSuccess?: (file: T) => void;
    onFileFail?: (file: T, error: Error) => void;
}
export type EventHandler<T = UploadRawFile> = DragHandler & FileHandler<T> & UploadHandler<T>;
export {};
