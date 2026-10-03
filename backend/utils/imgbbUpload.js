const axios = require("axios");
const FormData = require("form-data");

const uploadToImgBB = async (buffer, originalName) => {
  try {
    if (!process.env.IMGBB_API_KEY) {
      throw new Error("IMGBB_API_KEY is missing in .env");
    }

    const form = new FormData();

    form.append("image", buffer.toString("base64"));
    form.append("name", originalName);

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