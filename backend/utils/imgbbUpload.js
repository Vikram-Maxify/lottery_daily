const axios = require("axios");
const FormData = require("form-data");

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
const uploadToImgBB = async (input, originalName) => {
  try {
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
      throw new Error(
        `Invalid image buffer received. Type: ${typeof buffer}`
      );
    }

    if (!buffer.length) {
      throw new Error("Image buffer is empty");
    }

    const base64Image = buffer.toString("base64");

    console.log("========== ImgBB Upload Debug ==========");
    console.log("Original name:", name);
    console.log("Is Buffer:", Buffer.isBuffer(buffer));
    console.log("Buffer size:", buffer.length);
    console.log("Base64 length:", base64Image.length);
    console.log("Base64 preview:", base64Image.substring(0, 50));
    console.log("========================================");

    // ================================================
    // UPLOAD
    // ================================================

    const form = new FormData();

    form.append("image", base64Image);
    form.append("name", name || "image");

    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    if (!response.data?.success) {
      throw new Error("ImgBB upload failed");
    }

    return {
      imageUrl: response.data.data.url,
      displayUrl: response.data.data.display_url,
      deleteUrl: response.data.data.delete_url,
      thumbUrl: response.data.data.thumb?.url || null,
    };
  } catch (error) {
    console.error(
      "ImgBB Upload Error:",
      error.response?.data || error.message
    );

    throw new Error(
      error.response?.data?.error?.message ||
        error.message ||
        "Image upload failed"
    );
  }
};

module.exports = uploadToImgBB;