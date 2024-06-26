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
    const cartFishesCollection = client.db("grocery").collection("cartFishes");
    const ordersCollection = client.db("grocery").collection("orders");

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
      await usersCollection.insertOne({
        name,
        email,
        password: hashPassword,
        role: "user",
      });

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
      const token = jwt.sign(
        { _id: user._id, name: user.name, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.EXPIRES_IN,
        }
      );

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

    // update fish
    app.patch("/api/v1/fish/:fishId", async (req, res) => {
      const updatedFish = req.body;
      const fishId = req.params.fishId;
      const query = { _id: new ObjectId(fishId) };

      const updateIntoDb = {
        $set: {
          image: updatedFish.image,
          title: updatedFish.title,
          price: updatedFish.price,
          ratings: updatedFish.ratings,
          category: updatedFish.category,
          isDiscount: updatedFish.isDiscount,
          discountPercentage: updatedFish.discountPercentage,
          description: updatedFish.description,
          features: updatedFish.features,
        },
      };

      await fishesCollection.findOneAndUpdate(query, updateIntoDb);

      res.status(201).json({
        success: true,
        message: "Fish updated successfully",
      });
    });

    // delete Fish
    app.delete("/api/v1/fish/:fishId", async (req, res) => {
      const fishId = req.params.fishId;
      const query = { _id: new ObjectId(fishId) };

      await fishesCollection.findOneAndDelete(query);

      res.status(201).json({
        success: true,
        message: "Fish deleted successfully",
      });
    });

    // ==============================================================
    // CART Fish COLLECTION
    // ==============================================================

    // post cart product fish
    app.post("/api/v1/cartFish", async (req, res) => {
      const newCartFish = req.body;

      const query = {
        $and: [
          { title: newCartFish.title },
          { price: newCartFish.price },
          { email: newCartFish.email },
        ],
      };
      const alreadyExist = await cartFishesCollection.findOne(query);
      // console.log(alreadyExist);
      if (alreadyExist) {
        const updatedCartFish = {
          $set: {
            ...alreadyExist,
            quantity: alreadyExist.quantity ? alreadyExist.quantity + 1 : 2,
          },
        };
        // console.log(updatedCartFish);

        await cartFishesCollection.findOneAndUpdate(query, updatedCartFish);
      } else {
        // Remove the _id field from newCartFish
        delete newCartFish._id;

        // Insert supply donation into the database
        await cartFishesCollection.insertOne({ ...newCartFish, quantity: 1 });
      }

      res.status(201).json({
        success: true,
        message: "Add to cart successfully",
      });
    });

    // update cart fish quantity
    app.patch("/api/v1/cartFish/:fishId", async (req, res) => {
      const fishId = req.params.fishId;
      const { quantity } = req.body;
      const query = { _id: new ObjectId(fishId) };
      // console.log(quantity);

      if (quantity === 0) {
        await cartFishesCollection.findOneAndDelete(query);
        return res.status(201).json({
          success: true,
          message: "Quantity deleted successfully",
        });
      }

      const updateIntoDb = {
        $set: {
          quantity: quantity,
        },
      };

      await cartFishesCollection.findOneAndUpdate(query, updateIntoDb);

      res.status(201).json({
        success: true,
        message: "Quantity updated successfully",
      });
    });

    // get cart fish products
    app.get("/api/v1/cartFishes", async (req, res) => {
      let query = {};

      if (req.query?.email) {
        query.email = req.query.email;
      }

      const result = await cartFishesCollection.find(query).toArray();

      res.status(201).json({
        success: true,
        message: "Cart Fishes retrieved successfully",
        data: result,
      });
    });

    // ==============================================================
    // ORDERS COLLECTION
    // ==============================================================

    // post all orders
    app.post("/api/v1/orders", async (req, res) => {
      const cartFishes = req.body;

      // delete cart products based on email
      await cartFishesCollection.deleteMany({ email: cartFishes[0].email });

      // delete _id
      cartFishes.forEach((item) => {
        delete item._id;
        item.status = "Pending";
      });

      // post upcoming data into orders collection
      const result = await ordersCollection.insertMany(cartFishes);

      res.status(201).json({
        success: true,
        message: "Proceed checkout successfully complete",
        data: result,
      });
    });

    // get all orders with email query
    app.get("/api/v1/orders", async (req, res) => {
      let query = {};
      if (req.query.email) {
        query.email = req.query.email;
      }
      // console.log(query);

      const result = await ordersCollection.find(query).toArray();

      res.status(201).json({
        success: true,
        message: "My orders retrieved successfully",
        data: result,
      });
    });

    // update order status
    app.patch("/api/v1/order/:fishId", async (req, res) => {
      const fishId = req.params.fishId;
      const { status } = req.body;
      const query = { _id: new ObjectId(fishId) };

      const updateIntoDb = {
        $set: {
          status: status,
        },
      };

      await ordersCollection.findOneAndUpdate(query, updateIntoDb);

      res.status(201).json({
        success: true,
        message: "Order status updated successfully",
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
