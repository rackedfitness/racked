const JPEG_QUALITY = 0.82;

// Redrawing onto a canvas and re-encoding keeps only the pixels — every
// piece of metadata in the original file (EXIF GPS coordinates, camera
// serial, capture time) is dropped. Browsers apply the EXIF orientation when
// decoding into <img>, so the redrawn image still comes out the right way up.
function reencodeAsJpeg(file: File, maxDimension: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      URL.revokeObjectURL(url);
      if (!ctx) {
        reject(new Error("Could not process image"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Could not process image"))),
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image"));
    };
    img.src = url;
  });
}

// For anything uploaded to public storage (avatars, workout photos): strips
// location and other metadata, and caps the size.
export function prepareImageForUpload(file: File, maxDimension = 2048): Promise<Blob> {
  return reencodeAsJpeg(file, maxDimension);
}

// Claude's vision input is capped at ~1568px on the long edge regardless of
// what's sent, so there's no quality benefit to shipping more than that.
export async function resizeImageForAI(file: File): Promise<string> {
  const blob = await reencodeAsJpeg(file, 1568);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
