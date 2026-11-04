// Ambient declarations for Somtoday Mod global scope

interface String {
    replaceAt(index: number, replacement: string): string;
}

interface Window {
    getResourceAsText?: (file: string) => string;
    getResourceAsTextCache?: Record<string, string | null>;
    getResource?: (file: string) => string;
    getResourceAsBase64?: (file: string) => Promise<string>;
    getAudioUrl?: (sound: string) => string;
    logo?: (
        id?: string,
        classname?: string,
        color?: string,
        style?: string,
    ) => string;
    getIcon?: (
        name?: string,
        classname?: string,
        color?: string,
        start?: string,
    ) => string;
    get?: (key: string) => any;
    set?: (key: string, value: any) => void;
    modInit?: () => void;
    storageMethod?: string;
    data?: Record<string, unknown> | null;
    browser?: any;
    requestAnimFrame?: ((callback: FrameRequestCallback) => number) | any;
    [key: string]: unknown;
}

declare let browser: any;
declare function modInit(): void;
declare let requestAnimFrame: any;
