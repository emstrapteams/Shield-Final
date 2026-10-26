const cloudinary = require("../config/cloudinary");

const uploadEvidenceToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    if (!Buffer.isBuffer(file?.buffer) || file.buffer.length === 0) {
      reject(new Error("Evidence upload requires a non-empty file buffer."));
      return;
    }

    const resourceType = file.mimetype.startsWith("video/")
      ? "video"
      : "image";

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "emstrap-shield",
        resource_type: resourceType,
        use_filename: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result?.secure_url) {
          return reject(new Error("Cloudinary did not return an evidence URL."));
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id || null,
          mediaType: resourceType,
          uploadedAt: new Date(),
        });
      }
    );

    uploadStream.on("error", reject);
    uploadStream.end(file.buffer);
  });
};

module.exports = { uploadEvidenceToCloudinary };