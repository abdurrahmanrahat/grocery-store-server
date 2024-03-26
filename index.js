const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const fishesCollection = client.db("grocery").collection("fishes");

    // ==============================================================
    // Fish COLLECTION
    // ==============================================================

    // post Fish
    app.post("/api/v1/fish", async (req, res) => {
      const newFish = req.body;

      // Insert supply donation into the database
      await fishesCollection.insertOne(newFish);

      res.status(201).json({
        success: true,
        message: "Fish inserted successfully",
      });
    });

    // get Fishes
    app.get("/api/v1/fishes", async (req, res) => {
      let query = {};

      if (req.query.isDiscount) {
        query.isDiscount = req.query.isDiscount;
      }

      const result = await fishesCollection.find(query).toArray();

      res.status(201).json({
        success: true,
        message: "Fishes retrieved successfully",
        data: result,
      });
    });

    // get single Fish
    app.get("/api/v1/fishes/:fishId", async (req, res) => {
      const fishId = req.params.fishId;
      const query = { _id: new ObjectId(fishId) };
      const result = await fishesCollection.findOne(query);

      res.status(201).json({
        success: true,
        message: "Fish retrieved successfully",
        data: result,
      });
    });

    // ==============================================================
    // TESTIMONIALS COLLECTION
    // ==============================================================

    // // post testimonials
    // app.post("/api/v1/testimonials", async (req, res) => {
    //   const newData = req.body;

    //   // Insert supply donation into the database
    //   await testimonialsCollection.insertOne(newData);

    //   res.status(201).json({
    //     success: true,
    //     message: "Testimonial inserted successfully",
    //   });
    // });

    // // get testimonials
    // app.get("/api/v1/testimonials", async (req, res) => {
    //   const result = await testimonialsCollection.find().toArray();

    //   res.status(201).json({
    //     success: true,
    //     message: "Testimonials retrieved successfully",
    //     data: result,
    //   });
    // });

    // ==============================================================
    // GRATITUDE COLLECTION
    // ==============================================================

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
