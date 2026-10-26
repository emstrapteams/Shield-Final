const cloudinary = require("cloudinary").v2;

const cloudinaryConfig = {};

if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinaryConfig.cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
}
if (process.env.CLOUDINARY_API_KEY) {
  cloudinaryConfig.api_key = process.env.CLOUDINARY_API_KEY;
}
if (process.env.CLOUDINARY_API_SECRET) {
  cloudinaryConfig.api_secret = process.env.CLOUDINARY_API_SECRET;
}

cloudinary.config(cloudinaryConfig);

module.exports = cloudinary;