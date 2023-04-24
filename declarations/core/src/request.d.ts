import { UploadOption } from './option';
import { UploadRawFile } from './file';
interface RequestHandler {
    onStart: (file: UploadRawFile) => void;
    onProgress: (file: UploadRawFile) => void;
    onPause: (file: UploadRawFile) => void;
    onCancel: (file: UploadRawFile) => void;
    onComplete: (file: UploadRawFile) => void;
    onSuccess: (file: UploadRawFile) => void;
    onFail: (file: UploadRawFile, error: Error) => void;
}
export type RequestOption = UploadOption & RequestHandler;
export declare const createRequestList: (option: RequestOption) => {
    uploadRequest: (uploadFile: UploadRawFile, resume?: boolean) => Promise<void>;
    clearRequest: (uploadFile: UploadRawFile, cancel?: boolean) => void;
};
export {};
