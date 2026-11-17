
import dotenv from "dotenv";

dotenv.config();

import express from "express";
import { MongoClient } from "mongodb";
import cors from "cors";
import upload from "./config/multer.js";
import uploadToCloudinary from "./utils/cloudinaryUpload.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:3000",
  }),
);

app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

// Connect to MongoDB
export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

// Database
const db = client.db("black-coffee-store");

// Collection
const productCollection = db.collection("products_in_store");

// Add Product
app.post("/add-product", upload.single("productImage"), async (req, res) => {
  try {
    const data = req.body;

    if (!req.file) {
      return res.status(400).send({
        success: false,
        message: "Product image is required",
      });
    }

    // Upload image to Cloudinary
    const imageResult = await uploadToCloudinary(req.file.buffer);

    // Prepare product data
    const productData = {
      ...data,
      imageUrl: imageResult.secure_url,
      imagePublicId: imageResult.public_id,
    };

    // Save product to MongoDB
    const result = await productCollection.insertOne(productData);

    res.status(201).send({
      success: true,
      message: "Product added successfully",
      result,
    });
  } catch (error) {
    console.error("Add product error:", error);

    res.status(500).send({
      success: false,
      message: "Failed to add product",
    });
  }
});

// Start Server
async function startServer() {
  try {
    await connectToMongoDB();

    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();
