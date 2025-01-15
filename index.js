// Required modules
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();

// Enable CORS to handle cross-origin requests (if you're using it with a front-end framework like React)
app.use(cors());

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
app.post('/upload', upload.single('image'), (req, res) => {
  // Check if file is uploaded
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Generate the file URL to return to the client
  const fileUrl = `https://image-to-url-3hct.onrender.com/uploads/${req.file.filename}`;
  res.json({ fileUrl });
});

// Serve the uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
