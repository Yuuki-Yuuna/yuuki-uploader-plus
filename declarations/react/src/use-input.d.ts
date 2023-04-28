import { RefObject } from 'react';
import { UploaderOption } from 'yuuki-uploader-core';
export declare const useInput: (option: UploaderOption, addFileList: (fileList: File[]) => Promise<void>) => {
    register: (elementRef: RefObject<HTMLElement>) => void;
    unRegister: () => void;
    registerDrop: (elementRef: RefObject<HTMLElement>) => void;
    unRegisterDrop: () => void;
};
