const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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
    const usersCollection = client.db("grocery").collection("users");

    // ==============================================================
    // USER COLLECTION
    // ==============================================================

    // user registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password } = req.body;

      // check if use already exist
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // hash the password
      const hashPassword = await bcrypt.hash(password, 10);

      // insert user into db
      await usersCollection.insertOne({ name, email, password: hashPassword });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // user login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await usersCollection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid user" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid password" });
      }

      // generate jwt token
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.EXPIRES_IN,
      });

      res.json({
        success: true,
        message: "Login successfully",
        token,
      });
    });

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
      // console.log(req.query);

      if (req.query.discount) {
        query.isDiscount = true;
      }

      // if(req.query.category){
      //   query.category = req.query.category
      // }

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
