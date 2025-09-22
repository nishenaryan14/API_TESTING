import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import fs from "fs";

const app = express();
app.use(express.json());

// 👉 Hardcode env data here
const MONGO_URI = "mongodb+srv://aryannishen27:OyY5gkpkfSYRiLDY@cluster0.imq6em3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const PORT = 5000;

const client = new MongoClient(MONGO_URI);
let db, usersCollection;

// Connect DB + Insert dummy data if not exists
async function connectDB() {
  try {
    await client.connect();
    db = client.db("testdb");
    usersCollection = db.collection("users");
    console.log("✅ Connected to MongoDB Atlas");

    // Check if empty, then seed data
    const count = await usersCollection.countDocuments();
    if (count === 0) {
      const users = JSON.parse(fs.readFileSync("./users.json", "utf-8"));
      await usersCollection.insertMany(users);
      console.log("📥 Inserted dummy users into MongoDB");
    }
  } catch (err) {
    console.error("❌ DB Connection Error:", err);
  }
}
connectDB();

// Routes
app.get("/", (req, res) => res.send("API is running..."));

// Get all users
app.get("/users", async (req, res) => {
  const users = await usersCollection.find().toArray();
  res.json(users);
});

// Get single user by ID
app.get("/users/:id", async (req, res) => {
  try {
    const user = await usersCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: "Invalid ID format" });
  }
});

// Add new user (POST)
app.post("/users", async (req, res) => {
  const result = await usersCollection.insertOne(req.body);
  res.json({ insertedId: result.insertedId });
});

// Update user (PUT = full update)
app.put("/users/:id", async (req, res) => {
  try {
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    res.json({ modifiedCount: result.modifiedCount });
  } catch {
    res.status(400).json({ error: "Invalid ID format" });
  }
});

// Partial update (PATCH)
app.patch("/users/:id", async (req, res) => {
  try {
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    res.json({ modifiedCount: result.modifiedCount });
  } catch {
    res.status(400).json({ error: "Invalid ID format" });
  }
});

// Delete user
app.delete("/users/:id", async (req, res) => {
  try {
    const result = await usersCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ deletedCount: result.deletedCount });
  } catch {
    res.status(400).json({ error: "Invalid ID format" });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
