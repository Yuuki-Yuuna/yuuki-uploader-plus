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

type Awaitble<T> = T | Promise<T>;
type UploaderOption = FileOption & UploadOption & EventHandler;
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
interface FileHandler {
    onFileAdded?: (file: File) => Awaitble<boolean | void>;
    onFileReady?: (file: UploadFile) => Awaitble<void>;
    onFileRemoved?: (file: UploadFile) => void;
}
interface UploadHandler {
    onFileStart?: (file: UploadFile) => void;
    onFileProgress?: (file: UploadFile) => void;
    onFilePause?: (file: UploadFile) => void;
    onFileCancel?: (file: UploadFile) => void;
    onFileComplete?: (file: UploadFile) => void;
    onFileSuccess?: (file: UploadFile) => void;
    onFileFail?: (file: UploadFile, error: Error) => void;
}
type EventHandler = DragHandler & FileHandler & UploadHandler;
declare const defaultOption: UploaderOption;

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
    clearRequest: (uploadFile: UploadRawFile, cancel?: boolean) => void;
};

export { DragHandler, EventHandler, FileHandler, RequestOption, UploadFile, UploadHandler, UploadRawFile, UploadStatus, UploaderOption, calculateFile, createInupt, createRequestList, defaultOption };
