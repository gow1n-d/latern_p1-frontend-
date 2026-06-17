declare module 'mammoth' {
  export interface Image {
    read(type: "base64"): Promise<string>;
    contentType: string;
  }

  export const images: {
    imgElement(fn: (image: Image) => Promise<{ src: string; alt?: string }>): any;
  };

  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string; messages: any[] }>;
  
  export function convertToHtml(input: { arrayBuffer: ArrayBuffer }, options?: any): Promise<{ value: string; messages: any[] }>;
}
