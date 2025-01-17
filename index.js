// Required modules
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Enable CORS to handle cross-origin requests (if you're using it with a front-end framework like React)
app.use(cors());

// MongoDB Connection
const MONGO_URI = 'mongodb+srv://noorunishaafrin:mynwr1614@cluster0.nermz.mongodb.net/urlgenerate?retryWrites=true&w=majority&appName=Cluster0'; // Replace with your MongoDB connection string
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define a schema and model for uploaded files
const imageSchema = new mongoose.Schema({
  filename: String,
  url: String,
  uploadedAt: { type: Date, default: Date.now },
});

const Image = mongoose.model('Image', imageSchema);

// Set up the multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    fs.existsSync(uploadPath) || fs.mkdirSync(uploadPath); // Create folder if it doesn't exist
    cb(null, uploadPath); // Save files in the 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
  },
});

// Create an instance of multer with the storage configuration
const upload = multer({ storage });

// Define the upload route
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate the file URL
    const fileUrl = `https://image-to-url-3hct.onrender.com/uploads/${req.file.filename}`;

    // Save file info in MongoDB
    const newImage = new Image({
      filename: req.file.filename,
      url: fileUrl,
    });

    await newImage.save();

    // Respond with the file URL
    res.json({ fileUrl });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve static files in the uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
