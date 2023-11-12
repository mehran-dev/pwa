const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8585;

// Middleware for parsing JSON data in requests
app.use(express.json());

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

// Define a function to read posts from the JSON file
function readPosts() {
  try {
    const data = fs.readFileSync(postsFilePath);
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Define a function to write posts to the JSON file
function writePosts(posts) {
  fs.writeFileSync(postsFilePath, JSON.stringify(posts, null, 2));
}

// Get all posts
app.get("/getPosts", (req, res) => {
  const posts = readPosts();
  const postsWithImages = posts.map((post) => {
    if (post.image) {
      //http://example.com/uploads/image.jpg
      post.image = `${req.protocol}://${req.get("host")}/${"uploads"}/${
        post.image
      }`;
    }
    return post;
  });

  res.json(postsWithImages);
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

  const posts = readPosts();
  posts.push(newPost);
  writePosts(posts);

  res.json({ message: "Post added successfully" });
});

// Serve uploaded images
app.use("/uploads", express.static(imageStoragePath));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
