import * as mammoth from 'mammoth';

export interface ExtractedAsset {
  id: string;
  type: "image" | "text_block" | "table";
  content: string; // base64 for images, markdown for text/tables
  contextBefore: string;
  contextAfter: string;
  originalName?: string;
}

export interface ParsedDocument {
  fullText: string;
  assets: ExtractedAsset[];
}

export async function parseDocx(file: File): Promise<ParsedDocument> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        
        const assets: ExtractedAsset[] = [];
        let imageCounter = 0;
        let lastText = "";

        const options = {
          convertImage: mammoth.images.imgElement((image) => {
            return image.read("base64").then((imageBuffer) => {
              imageCounter++;
              const id = `extracted_img_${Date.now()}_${imageCounter}`;
              const dataUrl = `data:${image.contentType};base64,${imageBuffer}`;
              
              assets.push({
                id,
                type: "image",
                content: dataUrl,
                contextBefore: lastText.slice(-500), // last 500 chars before image
                contextAfter: "" // will be filled later
              });

              return {
                src: dataUrl,
                alt: `Extracted Image ${imageCounter}`
              };
            });
          })
        };

        const result = await mammoth.extractRawText({ arrayBuffer });
        const htmlResult = await mammoth.convertToHtml({ arrayBuffer }, options);
        
        // mammoth.convertToHtml doesn't give us stream parsing easily to know exact context. 
        // We'll extract raw text and rely on the convertToHtml for images.
        // It's a bit tricky to map contextBefore/After perfectly without a custom document walker.
        // For simplicity, we just return the full text and all images found.
        
        resolve({
          fullText: result.value,
          assets: assets
        });

      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
}

export async function parseMultipleImages(files: File[]): Promise<ParsedDocument> {
  const assets: ExtractedAsset[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith("image/")) continue;
    
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
    
    assets.push({
      id: `uploaded_img_${Date.now()}_${i}`,
      type: "image",
      content: dataUrl,
      contextBefore: file.name, // Use filename as context
      contextAfter: "",
      originalName: file.name
    });
  }
  
  return {
    fullText: "Multiple separate images uploaded.",
    assets
  };
}
