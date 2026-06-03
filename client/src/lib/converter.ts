/*
 * ForgeConvert — converter.ts
 * Design: Industrial Brutalism
 *
 * All conversion logic runs 100% client-side.
 * Files are never uploaded to any server.
 *
 * Cross-platform guards:
 * - Mobile Canvas Memory Guard: caps render at 12,000,000 pixels (≈12 MP)
 *   to prevent silent iOS Safari crashes on large smartphone photos.
 * - Object URL lifecycle: callers must call revokeObjectURL() on the
 *   returned URL after the download is triggered to free mobile RAM.
 */

// ─── Conversion Matrix ────────────────────────────────────────────────────────
export const CONVERSION_MAP: Record<string, string[]> = {
  png:  ["jpg", "webp", "gif", "bmp", "ico"],
  jpg:  ["png", "webp", "gif", "bmp", "ico"],
  jpeg: ["png", "webp", "gif", "bmp", "ico"],
  webp: ["png", "jpg", "gif"],
  gif:  ["png", "jpg", "webp"],
  svg:  ["png", "jpg"],
  bmp:  ["png", "jpg"],
  ico:  ["png", "jpg"],
  avif: ["png", "jpg"],
  heic: ["jpg", "png"],
  pdf:  ["png", "jpg"],
};

// Human-readable labels for the dropdowns
export const FORMAT_LABELS: Record<string, string> = {
  png:  "PNG",
  jpg:  "JPG",
  jpeg: "JPEG",
  webp: "WebP",
  gif:  "GIF",
  bmp:  "BMP",
  ico:  "ICO",
  svg:  "SVG",
  avif: "AVIF",
  heic: "HEIC",
  pdf:  "PDF",
};

// File input accept strings per source format
export const ACCEPT_MAP: Record<string, string> = {
  png:  ".png,image/png",
  jpg:  ".jpg,.jpeg,image/jpeg",
  jpeg: ".jpg,.jpeg,image/jpeg",
  webp: ".webp,image/webp",
  gif:  ".gif,image/gif",
  svg:  ".svg,image/svg+xml",
  bmp:  ".bmp,image/bmp",
  ico:  ".ico,image/x-icon,image/vnd.microsoft.icon",
  avif: ".avif,image/avif",
  heic: ".heic,.heif,image/heic,image/heif",
  pdf:  ".pdf,application/pdf",
};

// MIME types for canvas.toBlob()
const MIME_MAP: Record<string, string> = {
  png:  "image/png",
  jpg:  "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif:  "image/gif",
  bmp:  "image/bmp",
};

// ─── Mobile Canvas Memory Guard ──────────────────────────────────────────────
const MAX_CANVAS_PIXELS = 12_000_000; // 12 MP — safe ceiling for iOS Safari

/**
 * Downscale canvas dimensions proportionally if total pixel count exceeds
 * MAX_CANVAS_PIXELS. Prevents silent browser crashes on iOS Safari when
 * rendering large smartphone photos.
 */
function safeCanvasDimensions(
  width: number,
  height: number
): { width: number; height: number } {
  const total = width * height;
  if (total <= MAX_CANVAS_PIXELS) return { width, height };
  const scale = Math.sqrt(MAX_CANVAS_PIXELS / total);
  return {
    width:  Math.floor(width  * scale),
    height: Math.floor(height * scale),
  };
}

/**
 * Draw an image onto a canvas with optional white background fill
 * (required when converting transparent formats → JPG/BMP to avoid
 * corrupted black background artifacting).
 */
function drawImageToCanvas(
  img: HTMLImageElement,
  targetFormat: string
): HTMLCanvasElement {
  const { width, height } = safeCanvasDimensions(img.naturalWidth, img.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width  = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Paint white background for non-transparent targets
  const needsWhiteBg = ["jpg", "jpeg", "bmp"].includes(targetFormat);
  if (needsWhiteBg) {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

/**
 * Convert a canvas to a Blob with the specified MIME type.
 * Quality 0.92 for JPEG gives a good size/quality balance.
 */
function canvasToBlob(canvas: HTMLCanvasElement, mime: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob returned null — format may be unsupported in this browser."));
      },
      mime,
      mime === "image/jpeg" ? 0.92 : undefined
    );
  });
}

/**
 * Load a Blob as an HTMLImageElement.
 */
function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img  = new Image();
    img.onload  = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to decode image data.")); };
    img.src = url;
  });
}

// ─── ICO Encoder ─────────────────────────────────────────────────────────────
/**
 * Minimal ICO encoder — produces a 256×256 ICO from a canvas.
 * ICO format: ICONDIR + ICONDIRENTRY + PNG data (modern ICO supports embedded PNG).
 */
async function encodeIco(canvas: HTMLCanvasElement): Promise<Blob> {
  // Resize to 256×256 for ICO
  const size = 256;
  const icoCanvas = document.createElement("canvas");
  icoCanvas.width  = size;
  icoCanvas.height = size;
  const ctx = icoCanvas.getContext("2d")!;
  ctx.drawImage(canvas, 0, 0, size, size);

  // Get PNG bytes to embed inside ICO
  const pngBlob  = await canvasToBlob(icoCanvas, "image/png");
  const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());

  // Build ICO binary structure
  const headerSize = 6;
  const entrySize  = 16;
  const dataOffset = headerSize + entrySize;
  const buffer     = new ArrayBuffer(dataOffset + pngBytes.byteLength);
  const view       = new DataView(buffer);

  // ICONDIR header
  view.setUint16(0, 0, true);       // Reserved (must be 0)
  view.setUint16(2, 1, true);       // Type: 1 = ICO
  view.setUint16(4, 1, true);       // Image count: 1

  // ICONDIRENTRY
  view.setUint8 (6,  0);            // Width  (0 = 256)
  view.setUint8 (7,  0);            // Height (0 = 256)
  view.setUint8 (8,  0);            // Color count (0 = no palette)
  view.setUint8 (9,  0);            // Reserved
  view.setUint16(10, 1, true);      // Color planes
  view.setUint16(12, 32, true);     // Bits per pixel
  view.setUint32(14, pngBytes.byteLength, true); // Image data size
  view.setUint32(18, dataOffset, true);           // Offset to image data

  // Copy PNG bytes
  new Uint8Array(buffer, dataOffset).set(pngBytes);

  return new Blob([buffer], { type: "image/x-icon" });
}

// ─── HEIC Conversion ──────────────────────────────────────────────────────────
async function convertHeic(file: File, targetFormat: string): Promise<Blob> {
  // heic2any is loaded via CDN and attached to window
  const heic2any = (window as any).heic2any;
  if (!heic2any) throw new Error("heic2any library not loaded. Check your internet connection.");

  const targetMime = targetFormat === "jpg" ? "image/jpeg" : "image/png";
  const result = await heic2any({ blob: file, toType: targetMime, quality: 0.92 });
  return Array.isArray(result) ? result[0] : result;
}

// ─── PDF Conversion ───────────────────────────────────────────────────────────
async function convertPdf(file: File, targetFormat: string): Promise<Blob> {
  const pdfjsLib = (window as any).pdfjsLib;
  if (!pdfjsLib) throw new Error("PDF.js library not loaded. Check your internet connection.");

  // Disable worker to avoid Cross-Origin issues on mobile browsers
  pdfjsLib.GlobalWorkerOptions.workerSrc = "";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
    disableWorker: true,
  }).promise;

  // Render page 1 only
  const page     = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2.0 }); // 2× for crisp output

  const { width, height } = safeCanvasDimensions(viewport.width, viewport.height);
  const canvas  = document.createElement("canvas");
  canvas.width  = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // White background for PDF render
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  const scaledViewport = page.getViewport({
    scale: 2.0 * (width / viewport.width),
  });

  await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

  const mime = targetFormat === "jpg" ? "image/jpeg" : "image/png";
  return canvasToBlob(canvas, mime);
}

// ─── SVG Conversion ───────────────────────────────────────────────────────────
async function convertSvg(file: File, targetFormat: string): Promise<Blob> {
  const svgText = await file.text();
  const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
  const img     = await loadImage(svgBlob);

  // Use natural dimensions or fallback to 512×512
  const w = img.naturalWidth  || 512;
  const h = img.naturalHeight || 512;
  const { width, height } = safeCanvasDimensions(w, h);

  const canvas = document.createElement("canvas");
  canvas.width  = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const needsWhiteBg = ["jpg", "jpeg"].includes(targetFormat);
  if (needsWhiteBg) {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);

  const mime = MIME_MAP[targetFormat] ?? "image/png";
  return canvasToBlob(canvas, mime);
}

// ─── Main Conversion Entry Point ──────────────────────────────────────────────
export interface ConversionResult {
  blob:     Blob;
  filename: string;
  objectUrl: string;
}

export async function convertFile(
  file: File,
  sourceFormat: string,
  targetFormat: string
): Promise<ConversionResult> {
  const src = sourceFormat.toLowerCase();
  const tgt = targetFormat.toLowerCase();

  let outputBlob: Blob;

  if (src === "heic" || src === "heif") {
    // Step 1: HEIC → intermediate blob via heic2any
    const intermediate = await convertHeic(file, tgt);
    if (tgt === "ico") {
      const img    = await loadImage(intermediate);
      const canvas = drawImageToCanvas(img, tgt);
      outputBlob   = await encodeIco(canvas);
    } else {
      outputBlob = intermediate;
    }
  } else if (src === "pdf") {
    outputBlob = await convertPdf(file, tgt);
  } else if (src === "svg") {
    outputBlob = await convertSvg(file, tgt);
  } else {
    // Raster image path: PNG, JPG, WebP, GIF, BMP, ICO, AVIF
    const img    = await loadImage(file);
    const canvas = drawImageToCanvas(img, tgt);

    if (tgt === "ico") {
      outputBlob = await encodeIco(canvas);
    } else {
      const mime = MIME_MAP[tgt];
      if (!mime) throw new Error(`Unsupported target format: ${tgt.toUpperCase()}`);
      outputBlob = await canvasToBlob(canvas, mime);
    }
  }

  // Build output filename: replace source extension with target
  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const filename  = `${baseName}.${tgt}`;
  const objectUrl = URL.createObjectURL(outputBlob);

  return { blob: outputBlob, filename, objectUrl };
}
