const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const webpush = require("web-push");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8585;

// Middleware for parsing JSON data in requests
app.use(express.json());
app.use(cors());

// Set up Multer for handling file uploads
const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, uniqueSuffix + fileExtension);
  },
});
const upload = multer({ storage });

// Define the JSON and image storage paths
const postsFilePath = "posts.json";
const imageStoragePath = "uploads";

function readData() {
  try {
    const data = fs.readFileSync(postsFilePath);
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Define a function to write posts to the JSON file
function writeData(posts) {
  fs.writeFileSync(postsFilePath, JSON.stringify(posts, null, 2));
}

// Get all posts
app.get("/getPosts", (req, res) => {
  const { posts } = readData();
  const postsWithImages = posts.map((post) => {
    if (post.image) {
      post.image = `${req.protocol}://${req.get("host")}/${"uploads"}/${
        post.image
      }`;
    }
    return post;
  });

  res.json(postsWithImages);
});

app.post("/subscriptions", (req, res) => {
  console.log(req.body);
  const data = readData();
  const { subscriptions } = data;

  subscriptions.push(req.body);
  writeData({ ...data, subscriptions: [...subscriptions] });
  res.status(201).json({ ok: true });
});
app.post("/notify-all", (req, res) => {
  console.log("KEYs", process.env.publicKey);

  const data = readData();
  const { subscriptions } = data;

  // webpush.setGCMAPIKey("<Your GCM API Key Here>");
  webpush.setVapidDetails(
    "mailto:example@yourdomain.org",
    process.env.publicKey,
    process.env.privateKey
  );

  subscriptions.forEach((sub) => {
    // This is the same output of calling JSON.stringify on a PushSubscription
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        auth: sub.keys.auth,
        p256dh: sub.keys.p256dh,
      },
    };

    webpush.sendNotification(
      pushSubscription,

      JSON.stringify({
        title: "New!",
        content: "Something new happened!",
        openUrl: "/",
      })
    );
  });

  res.status(200).json({ "notified-count": subscriptions.length });
});

// Add a new post
app.post("/addPost", upload.single("file"), (req, res) => {
  const { id, title, location, rawLocationLat, rawLocationLng } = req.body;
  const imagePath = req.file ? req.file.filename : null;

  if (!title) {
    return res.status(400).json({ message: "Title are required" });
  }

  const newPost = {
    id,
    title,
    location,
    rawLocationLat,
    rawLocationLng,
    image: imagePath,
  };

  const data = readData();
  const { posts } = data;
  posts.push(newPost);
  writeData({ ...data, ...posts });

  res.json({ message: "Post added successfully", id });
});

// Serve uploaded images
app.use("/uploads", express.static(imageStoragePath));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
