import { FileOption, DragHandler } from './option';
export declare const createInupt: (option: FileOption & DragHandler, addFileList: (fileList: File[]) => Promise<void>) => {
    register: (element: HTMLElement) => void;
    unRegister: () => void;
    registerDrop: (element: HTMLElement) => void;
    unRegisterDrop: () => void;
};
