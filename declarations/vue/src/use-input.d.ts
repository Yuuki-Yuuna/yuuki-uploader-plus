import { Ref } from 'vue';
import { UploaderOption } from './use-uploader';
export declare const useInput: (option: UploaderOption, addFileList: (fileList: File[]) => Promise<void>) => {
    register: (elementRef: Ref<HTMLElement | undefined>) => void;
    unRegister: () => void;
    registerDrop: (elementRef: Ref<HTMLElement | undefined>) => void;
    unRegisterDrop: () => void;
};
