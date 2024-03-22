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
    // VOLUNTEERS COLLECTION
    // ==============================================================

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
