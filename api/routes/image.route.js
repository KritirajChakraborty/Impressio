import express from "express";
import multer from "multer";
import sharp from "sharp";
import cloudinary from "../config/cloudinary.js";
import auth from "../middleware/auth.js";
import Image from "../model/image.model.js";
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.post("/upload", auth, upload.single("image"), async (req, res) => {
  try {
    const {
      format = "jpeg", // Default format: JPEG
      width = 800, // Default width: 800px
      height = null, // Default height: maintain aspect ratio
      quality = 80, // Default quality: 80%
      dpi = 72, // Default DPI: 72
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No image provided" });
    }

    // Process the image using Sharp with the specified or default options
    const processedImageBuffer = await sharp(req.file.buffer)
      .resize({
        width: parseInt(width),
        height: height ? parseInt(height) : undefined,
        fit: sharp.fit.contain,
      })
      .toFormat(format, {
        quality: parseInt(quality),
        chromaSubsampling: "4:4:4",
      })
      .withMetadata({ density: parseInt(dpi) }) // Set DPI
      .toBuffer();

    // Upload original to Cloudinary
    const originalResult = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${req.file.buffer.toString("base64")}`
    );

    // Upload compressed version to Cloudinary
    const compressedResult = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${processedImageBuffer.toString("base64")}`
    );

    // Save image data to MongoDB
    const image = new Image({
      userId: req.userData.userId,
      originalUrl: originalResult.secure_url,
      compressedUrl: compressedResult.secure_url,
      originalCloudinaryId: originalResult.public_id,
      compressedCloudinaryId: compressedResult.public_id,
      originalSize: req.file.size,
      compressedSize: processedImageBuffer.length,
    });

    const savedImage = await image.save();

    res.json({
      imageId: savedImage._id,
      original: originalResult.secure_url,
      compressed: compressedResult.secure_url,
      originalSize: req.file.size,
      compressedSize: processedImageBuffer.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error processing image" });
  }
});

router.get("/history", auth, async (req, res) => {
  try {
    const images = await Image.find({ userId: req.userData.userId }).sort({
      createdAt: -1,
    });
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: "Error fetching image history" });
  }
});

router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Find the image in MongoDB by ID
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Delete the image from Cloudinary
    await cloudinary.uploader.destroy(image.originalCloudinaryId);
    await cloudinary.uploader.destroy(image.compressedCloudinaryId);

    // Remove the image record from MongoDB
    await Image.findByIdAndDelete(id);

    res.status(200).json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ message: "Failed to delete image" });
  }
});

export default router;
