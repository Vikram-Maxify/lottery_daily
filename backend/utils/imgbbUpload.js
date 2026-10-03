const axios = require("axios");
const FormData = require("form-data");

const uploadToImgBB = async (buffer, originalName) => {
  try {
    if (!process.env.IMGBB_API_KEY) {
      throw new Error("IMGBB_API_KEY is missing in .env");
    }

    // IMPORTANT: validate incoming buffer
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
    console.log("Original name:", originalName);
    console.log("Buffer:", Buffer.isBuffer(buffer));
    console.log("Buffer size:", buffer.length);
    console.log("Base64 length:", base64Image.length);
    console.log("Base64 preview:", base64Image.substring(0, 50));
    console.log("========================================");

    const form = new FormData();

    form.append("image", base64Image);
    form.append("name", originalName || "image");

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