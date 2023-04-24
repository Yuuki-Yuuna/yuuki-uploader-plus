export interface FileInformation {
    totalChunks: number;
    chunkSize: number;
    filename: string;
    totalSize: number;
    hash: string;
    webkitRelativePath: string;
}
export interface TestChunk extends FileInformation {
    chunkIndex: number;
    currentSize: number;
}
export interface Chunk extends TestChunk {
    file: Blob;
}
export declare class UploadRawFile {
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
