require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Setup
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.p62hq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Main Function 
async function run() {
    try {
        await client.connect();

        const db = client.db("chillGamers");
        const reviewsCollection = db.collection("reviews");
        const usersCollection = db.collection("users");
        const watchListCollection = db.collection("watchList");


        // REVIEW ROUTES 
        // Create a new review
        app.post("/review", async (req, res) => {
            const review = req.body;
            review.rating = Number(review.rating);
            review.year = Number(review.year);
            const result = await reviewsCollection.insertOne(review);
            res.send(result);
        });

        // Get all reviews
        app.get("/reviews", async (req, res) => {
            const result = await reviewsCollection.find().toArray();
            res.send(result);
        });

        // Get reviews by user email
        app.get("/my-review", async (req, res) => {
            const email = req.query.email;
            const query = { userEmail: email };
            const result = await reviewsCollection.find(query).toArray();
            res.send(result);
        });

        // Get a single review by ID
        app.get("/review/:id", async (req, res) => {
            const id = req.params.id;
            const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });
            res.send(review);
        });

        // Delete a review by ID
        app.delete("/review/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await reviewsCollection.deleteOne(query);
            res.send(result);
        });

        // Update review by ID
        app.put("/review/:id", async (req, res) => {
            const id = req.params.id;
            const updatedData = req.body;

            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    coverUrl: updatedData.coverUrl,
                    title: updatedData.title,
                    description: updatedData.description,
                    rating: Number(updatedData.rating),
                    year: Number(updatedData.year),
                    genre: updatedData.genre
                }
            };

            const result = await reviewsCollection.updateOne(filter, updateDoc);
            res.send(result);
        });


        // WATCHLIST ROUTES 
        // Add to WatchList
        // app.post("/watchList", async (req, res) => {
        //     const newItem = req.body;
        //     const result = await watchListCollection.insertOne(newItem);
        //     res.send(result);
        // });

        // Add to WatchList 
        app.post("/watchList", async (req, res) => {
            const newItem = req.body;

            const query = {
                userEmail: newItem.userEmail,
                title: newItem.title,
            };

            const existingItem = await watchListCollection.findOne(query);

            if (existingItem) {
                return res.send(
                    {
                        success: false,
                        message: "Already in WatchList"
                    });
            }

            const result = await watchListCollection.insertOne(newItem);
            res.send({ success: true, message: "Added to WatchList!", result });
        });



        // Get WatchList by user email
        app.get("/watchList", async (req, res) => {
            const email = req.query.email;
            const query = { userEmail: email };
            const result = await watchListCollection.find(query).toArray();
            res.send(result);
        });

        // Delete WatchList item by ID
        app.delete("/watchList/:id", async (req, res) => {
            const id = req.params.id;
            const result = await watchListCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });


        // Highest Rated Games
        // Get Top 6 Highest Rated Games
        app.get("/top-rated", async (req, res) => {
            const result = await reviewsCollection
                .find()
                .sort({ rating: -1 })
                .limit(6)
                .toArray();
            res.send(result);
        });


        // USER ROUTES 
        // Store or update a user
        app.put("/users", async (req, res) => {
            const { email, name, photo } = req.body;
            const filter = { email };
            const updateDoc = { $set: { email, name, photo } };
            const options = { upsert: true };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send({ message: "User stored/updated successfully", result });
        });

        // Get all users
        app.get("/users", async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });


        //Mongo Connection 
        await client.db("admin").command({ ping: 1 });
        console.log("Connected to MongoDB successfully.");

    } finally {
        // await client.close();
    }
}

run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("Hello World! Server is running.");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
