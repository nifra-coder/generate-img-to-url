// Required modules
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const cors = require('cors');
require('dotenv').config(); // Load .env file

// Initialize Express app
const app = express();
app.use(cors());

// MongoDB Atlas Connection
const mongoURI = process.env.MONGO_URI; // Load from .env

// Connect to MongoDB
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

// Create GridFS storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return {
      bucketName: 'uploads', // Collection name in MongoDB
      filename: `${Date.now()}-${file.originalname}`,
    };
  },
});

// Create Multer middleware
const upload = multer({ storage });

// Upload route
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({
    fileUrl: `https://image-to-url-3hct.onrender.com/uploads/${req.file.filename}`,
  });
});

// Serve files from MongoDB (optional)
app.get('/uploads/:filename', async (req, res) => {
  const { filename } = req.params;
  const db = mongoose.connection.db;
  const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });

  bucket.find({ filename }).toArray((err, files) => {
    if (!files || files.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    const downloadStream = bucket.openDownloadStreamByName(filename);
    downloadStream.pipe(res);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
