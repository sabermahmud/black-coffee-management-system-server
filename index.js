
import "dotenv/config";

import express from "express";
import { MongoClient } from "mongodb";
import cors from "cors";
import upload from "./config/multer.js";
import uploadToCloudinary from "./utils/cloudinaryUpload.js";

const app = express();
const port = process.env.PORT || 5000;

// CORS
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      process.env.CLIENT_SITE_URL,
    ].filter(Boolean),
  }),
);

app.use(express.json());

// MongoDB Client
const client = new MongoClient(process.env.MONGODB_URI);

const db = client.db("black-coffee-store");
const productCollection = db.collection("products_in_store");

// MongoDB Connection
let connectionPromise;

async function connectToMongoDB() {
  if (!connectionPromise) {
    connectionPromise = client.connect().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  return connectionPromise;
}

// Health Check
app.get("/", (req, res) => {
  res.status(200).send("Black Coffee API is running!");
});

// Add Product
app.post("/add-product", upload.single("productImage"), async (req, res) => {
  try {
    await connectToMongoDB();

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

// get products data
app.get("/products",async(req,res)=>{
  const data = await productCollection.find().toArray()
  res.send(data)
})

// Local Development Server
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

// Vercel Serverless Export
export default app;
