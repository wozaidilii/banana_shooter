export const ACCEPTED_SKIN_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
export const MAX_SKIN_IMAGE_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_SKIN_IMAGE_DIMENSION = 1024;

export interface ProcessedSkinImage {
  dataUrl: string;
  width: number;
  height: number;
}

export async function processSkinImageFile(
  file: File | null | undefined,
): Promise<{ ok: true; image: ProcessedSkinImage } | { ok: false; reason: string }> {
  if (!file) return { ok: false, reason: "请上传皮肤图片" };
  if (!ACCEPTED_SKIN_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_SKIN_IMAGE_TYPES)[number])) {
    return { ok: false, reason: "请上传 PNG、JPG、WEBP 或 GIF 图片" };
  }
  if (file.size > MAX_SKIN_IMAGE_FILE_BYTES) {
    return { ok: false, reason: "图片不能超过 2MB" };
  }

  try {
    const bitmap = await loadImageBitmap(file);
    const { width, height } = fitDimensions(bitmap.width, bitmap.height, MAX_SKIN_IMAGE_DIMENSION);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { ok: false, reason: "图片处理失败" };
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const dataUrl = canvas.toDataURL("image/webp", 0.86);
    return { ok: true, image: { dataUrl, width, height } };
  } catch {
    return { ok: false, reason: "图片读取失败，请换一张试试" };
  }
}

function fitDimensions(width: number, height: number, max: number) {
  if (width <= max && height <= max) return { width, height };
  const scale = max / Math.max(width, height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function loadImageBitmap(file: File): Promise<ImageBitmap> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      createImageBitmap(img).then(resolve).catch(reject);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("load failed"));
    };
    img.src = url;
  });
}
