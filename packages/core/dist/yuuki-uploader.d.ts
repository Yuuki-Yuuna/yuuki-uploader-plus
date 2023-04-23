interface FileInformation {
    totalChunks: number;
    chunkSize: number;
    filename: string;
    totalSize: number;
    hash: string;
    webkitRelativePath: string;
}
interface TestChunk extends FileInformation {
    chunkIndex: number;
    currentSize: number;
}
interface Chunk extends TestChunk {
    file: Blob;
}
declare class UploadRawFile {
    uid: number;
    file: File;
    hash: string;
    chunks: Chunk[];
    chunksLoaded: number[];
    progress: number;
    currentSpeed: number;
    averageSpeed: number;
    lastTimestamp: number;
    constructor(file: File);
    get isCompleted(): boolean;
    updateProgress(): void;
}

type Awaitble<T> = T | Promise<T>;
type Option<T = UploadRawFile> = FileOption & UploadOption & EventHandler<T>;
interface FileOption {
    accept: string;
    multiple: boolean;
    directoryMode: boolean;
    chunkSize: number;
}
interface UploadOption {
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
interface DragHandler {
    onDragEnter?: (event: DragEvent) => void;
    onDragOver?: (event: DragEvent) => void;
    onDragLeave?: (event: DragEvent) => void;
}
interface FileHandler<T = UploadRawFile> {
    onFileAdded?: (file: File) => Awaitble<boolean | void>;
    onFileReady?: (file: T) => Awaitble<void>;
    onFileRemoved?: (file: T) => void;
}
interface UploadHandler<T = UploadRawFile> {
    onFileStart?: (file: T) => void;
    onFileProgress?: (file: T) => void;
    onFilePause?: (file: T) => void;
    onFileCancel?: (file: T) => void;
    onFileComplete?: (file: T) => void;
    onFileSuccess?: (file: T) => void;
    onFileFail?: (file: T, error: Error) => void;
}
type EventHandler<T = UploadRawFile> = DragHandler & FileHandler<T> & UploadHandler<T>;

declare const calculateFile: (option: FileOption, uploadFile: UploadRawFile) => Promise<UploadRawFile>;

declare const createInupt: (option: FileOption & DragHandler, addFileList: (fileList: File[]) => Promise<void>) => {
    register: (element: HTMLElement) => void;
    unRegister: () => void;
    registerDrop: (element: HTMLElement) => void;
    unRegisterDrop: () => void;
};

interface RequestHandler {
    onStart: (file: UploadRawFile) => void;
    onProgress: (file: UploadRawFile) => void;
    onPause: (file: UploadRawFile) => void;
    onCancel: (file: UploadRawFile) => void;
    onComplete: (file: UploadRawFile) => void;
    onSuccess: (file: UploadRawFile) => void;
    onFail: (file: UploadRawFile, error: Error) => void;
}
type RequestOption = UploadOption & RequestHandler;
declare const createRequestList: (option: RequestOption) => {
    uploadRequest: (uploadFile: UploadRawFile, resume?: boolean) => Promise<void>;
    clearRequest: (uploadFile: UploadRawFile, cancel: boolean) => void;
};

export { DragHandler, EventHandler, FileHandler, Option, RequestOption, UploadHandler, UploadRawFile, calculateFile, createInupt, createRequestList };
