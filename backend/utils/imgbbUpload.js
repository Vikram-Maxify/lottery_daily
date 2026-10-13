const axios = require("axios");
const FormData = require("form-data");

// Optional: image normalize karne ke liye (npm install sharp)
let sharp = null;
try {
  sharp = require("sharp");
} catch {
  sharp = null;
}

/**
 * Uploads an image to ImgBB.
 *
 * Accepts EITHER:
 *   - a Buffer              → uploadToImgBB(buffer, "name.jpg")
 *   - a Multer file object  → uploadToImgBB(req.file)
 *
 * Returns:
 *   { imageUrl, displayUrl, deleteUrl, thumbUrl }
 */

const IMGBB_ENDPOINT = "https://api.imgbb.com/1/upload";
const MAX_ATTEMPTS = 5;
const REQUEST_TIMEOUT_MS = 60000;
const MAX_DIMENSION = 1600; // px, isse badi image resize hogi

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Remove spaces, brackets and other special characters from the file name.
// ImgBB can reject names such as "abc (1).png" with "Internal upload error".
const sanitizeName = (name) => {
  const raw = String(name || "image").trim();
  const withoutExt = raw.replace(/\.[a-z0-9]+$/i, "");
  const cleaned = withoutExt
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 80);
  return cleaned || "image";
};

const detectMimeType = (buffer) => {
  if (buffer.length >= 4) {
    if (buffer[0] === 0x89 && buffer[1] === 0x50)
      return { mime: "image/png", ext: "png" };
    if (buffer[0] === 0xff && buffer[1] === 0xd8)
      return { mime: "image/jpeg", ext: "jpg" };
    if (buffer.slice(0, 4).toString() === "RIFF")
      return { mime: "image/webp", ext: "webp" };
    if (buffer.slice(0, 3).toString() === "GIF")
      return { mime: "image/gif", ext: "gif" };
  }
  return { mime: "application/octet-stream", ext: "png" };
};

// =====================================================
// NORMALIZE IMAGE
// Auto-rotate, metadata strip, resize, clean re-encode.
// ImgBB ke "Internal upload error" ka sabse common reason
// weird metadata / colorspace / bahut bada resolution hota hai.
// =====================================================
const normalizeImage = async (buffer) => {
  if (!sharp) return buffer;

  try {
    // GIF animation ko mat chhedo
    if (buffer.slice(0, 3).toString() === "GIF") return buffer;

    const meta = await sharp(buffer, { failOn: "none" }).metadata();

    const pipeline = sharp(buffer, { failOn: "none" })
      .rotate() // EXIF orientation fix, metadata hat jata hai
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      });

    // Transparency ho to PNG, warna JPEG (chhota aur reliable)
    const output = meta.hasAlpha
      ? await pipeline.png({ compressionLevel: 9 }).toBuffer()
      : await pipeline.jpeg({ quality: 85, progressive: false }).toBuffer();

    return output.length ? output : buffer;
  } catch (err) {
    console.warn("Image normalize failed, using original:", err.message);
    return buffer;
  }
};

// Strategy 1: send the raw binary file
const uploadBinary = async (buffer, safeName, withName = true) => {
  const { mime, ext } = detectMimeType(buffer);
  const form = new FormData();

  form.append("image", buffer, {
    filename: `${safeName}.${ext}`,
    contentType: mime,
  });
  if (withName) form.append("name", safeName);

  return axios.post(
    `${IMGBB_ENDPOINT}?key=${process.env.IMGBB_API_KEY}`,
    form,
    {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: REQUEST_TIMEOUT_MS,
    },
  );
};

// Strategy 2: send base64 as application/x-www-form-urlencoded
const uploadBase64 = async (buffer, safeName, withName = true) => {
  const params = new URLSearchParams();
  params.append("image", buffer.toString("base64"));
  if (withName) params.append("name", safeName);

  return axios.post(
    `${IMGBB_ENDPOINT}?key=${process.env.IMGBB_API_KEY}`,
    params.toString(),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: REQUEST_TIMEOUT_MS,
    },
  );
};

// Har attempt me alag tareeka try hota hai
const STRATEGIES = [
  { label: "binary", run: (b, n) => uploadBinary(b, n, true) },
  { label: "base64", run: (b, n) => uploadBase64(b, n, true) },
  { label: "binary-noname", run: (b, n) => uploadBinary(b, n, false) },
  { label: "base64-noname", run: (b, n) => uploadBase64(b, n, false) },
  { label: "binary", run: (b, n) => uploadBinary(b, n, true) },
];

// Errors that should NOT be retried (bad key, forbidden, etc.)
const isPermanentError = (error) => {
  const status = error.response?.status;
  const code = error.response?.data?.error?.code;
  // 111 = ImgBB "Internal upload error" → transient, retry it
  if (code === 111) return false;
  if (status === 401 || status === 403) return true;
  return false;
};

const uploadToImgBB = async (input, originalName) => {
  if (!process.env.IMGBB_API_KEY) {
    throw new Error("IMGBB_API_KEY is missing in .env");
  }

  // ================================================
  // NORMALIZE INPUT → buffer + name
  // ================================================

  let buffer = input;
  let name = originalName;

  if (input && !Buffer.isBuffer(input) && typeof input === "object") {
    // Multer file object
    buffer = input.buffer;
    name = name || input.originalname;
  }

  // ================================================
  // VALIDATION
  // ================================================

  if (!Buffer.isBuffer(buffer)) {
    throw new Error(`Invalid image buffer received. Type: ${typeof buffer}`);
  }

  if (!buffer.length) {
    throw new Error("Image buffer is empty");
  }

  const originalSize = buffer.length;

  // Clean re-encode (resize + metadata strip) → upload zyada reliable
  buffer = await normalizeImage(buffer);

  const safeName = sanitizeName(name);

  console.log("========== ImgBB Upload Debug ==========");
  console.log("Original name:", name);
  console.log("Sanitized name:", safeName);
  console.log("Original size:", originalSize);
  console.log("Upload size:", buffer.length);
  console.log("Sharp enabled:", Boolean(sharp));
  console.log("========================================");

  // ================================================
  // UPLOAD WITH RETRY + FALLBACK
  // ================================================

  let lastError = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const strategy = STRATEGIES[attempt] || STRATEGIES[0];

    try {
      const response = await strategy.run(buffer, safeName);

      if (!response.data?.success) {
        throw new Error("ImgBB upload failed");
      }

      const data = response.data.data;

      return {
        imageUrl: data.url,
        displayUrl: data.display_url,
        deleteUrl: data.delete_url,
        thumbUrl: data.thumb?.url || null,
      };
    } catch (error) {
      lastError = error;

      console.error(
        `ImgBB Upload Error (attempt ${attempt + 1}/${MAX_ATTEMPTS}, ${strategy.label}):`,
        error.response?.status,
        error.response?.data || error.message,
      );

      if (isPermanentError(error)) break;

      if (attempt < MAX_ATTEMPTS - 1) {
        // badhta gap + random jitter (ImgBB ko saans lene ka time)
        await sleep(1500 * (attempt + 1) + Math.floor(Math.random() * 500));
      }
    }
  }

  const code = lastError?.response?.data?.error?.code;
  const message =
    code === 111
      ? "The image hosting service could not process this image. Please try again or upload a smaller JPG/PNG image."
      : lastError?.response?.data?.error?.message ||
        lastError?.message ||
        "Image upload failed";

  throw new Error(message);
};

module.exports = uploadToImgBB;
