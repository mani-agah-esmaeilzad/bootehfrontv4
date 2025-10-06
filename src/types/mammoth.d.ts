// فایل: src/types/mammoth.d.ts
declare module 'mammoth' {
  interface MammothOptions {
    arrayBuffer: ArrayBuffer;
  }

  interface MammothResult {
    value: string;
    messages: any[];
  }

  const mammoth: {
    extractRawText(options: MammothOptions): Promise<MammothResult>;
  };

  export = mammoth;
}
