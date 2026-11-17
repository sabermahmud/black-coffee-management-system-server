import express from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import cors from "cors";

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(
  cors({
    origin: "http://localhost:3000",
  }),
);
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.log(err);
  }
}

// get Database
const db = client.db("black-coffee-store");

//collections in database
const productCollection = db.collection("products_in_store");

//add new product to database collection
app.post("/add-product", async (req, res) => {
  const data = req.body;
  const result = await productCollection.insertOne(data);
  res.send(result);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

connectToMongoDB();
