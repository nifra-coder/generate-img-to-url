// Required modules
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { GridFSBucket } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Enable CORS
app.use(cors());

// MongoDB connection URI (replace with your own)
const MONGO_URI = process.env.MONGO_URI || 'your_mongo_connection_string';

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Initialize GridFSBucket
const conn = mongoose.connection;
let bucket;

conn.once('open', () => {
  bucket = new GridFSBucket(conn.db, { bucketName: 'uploads' });
  console.log('GridFSBucket initialized');
});

// Configure multer for file upload
const storage = multer.memoryStorage(); // Store files in memory temporarily
const upload = multer({ storage });

// Route to upload a file
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
    });

    uploadStream.end(req.file.buffer); // Upload file data from memory
    uploadStream.on('finish', () => {
      // Construct the file URL
      const fileUrl = `${req.protocol}://${req.get('host')}/file/${uploadStream.filename}`;
      res.status(201).json({
        message: 'File uploaded successfully',
        file: {
          id: uploadStream.id, // MongoDB ObjectId
          filename: uploadStream.filename,
          url: fileUrl, // URL to access the uploaded file
        },
      });
    });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to fetch a file by filename
app.get('/file/:filename', async (req, res) => {
  const { filename } = req.params;

  try {
    const filesCollection = conn.db.collection('uploads.files');
    const file = await filesCollection.findOne({ filename });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const readStream = bucket.openDownloadStreamByName(filename);
    res.setHeader('Content-Type', file.contentType);
    readStream.pipe(res);
  } catch (err) {
    console.error('Error fetching file:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to delete a file by ID
app.delete('/file/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await bucket.delete(new mongoose.Types.ObjectId(id));
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
