const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
app.use(cors());

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert('./serviceAccountKey.json'),
  storageBucket: 'gs://herbal-cartel.appspot.com'
});

// Initialize Firebase Storage
const storage = admin.storage();
const bucket = storage.bucket();

// Initialize MongoDB connection
mongoose.connect('mongodb+srv://ritheshp11:admin@herbcartel.bilcy0r.mongodb.net/herbel_cartel', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

// Event listeners for MongoDB connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('MongoDB connected successfully');
});

// Define MongoDB schema and model
const plantSchema = new mongoose.Schema({
  name: String,
  email: String,
  place: String,
  plantName: String,
  scientificName: String,
  category: String,
  information: String,
  imageUrl: String,
  kannada:String,
  hindi:String,
  telugu:String,
  tamil:String,
  uses:String,
  demerits:String,
});
const Plant = mongoose.model('AdditionalPlants', plantSchema, 'AdditionalPlants');

// Set up Multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage()
});

// Handle file upload endpoint
app.post('/upload', upload.single('image'), async (req, res) => {
  console.log("received data" + JSON.stringify(req.body));
  try {
    // Upload image to Firebase Storage
    const file = req.file;
    const fileName = Date.now() + '-' + file.originalname;
    const fileUpload = bucket.file(fileName);
    const fileStream = fileUpload.createWriteStream();
    fileStream.on('error', (err) => {
      console.error('Error uploading to Firebase:', err);
      res.status(500).send('Error uploading file to Firebase');
    });

    fileStream.on('finish', async () => {
      try {
        const [url] = await fileUpload.getSignedUrl({
          action: 'read',
          expires: '03-09-2025', // Set an expiration date if needed
        });

        console.log('File uploaded successfully.');
        console.log('Download URL:', url);

        // Save plant data to MongoDB
        const newPlant = new Plant({
          name: req.body.name,
          email: req.body.email,
          place: req.body.place,
          plantName: req.body.plantName,
          scientificName: req.body.scientificName,
          category: req.body.category,
          information: req.body.information,
          imageUrl: url,
          kannada: "nill",
          hindi: "nill",
          telugu: "nill",
          tamil: "nill",
          uses: "nill",
          demerits: "nill",
        });

        await newPlant.save();

        // Send response to the client
        res.status(201).json({ downloadUrl: url });
      } catch (error) {
        console.error('Error getting download URL:', error);
        res.status(500).send('Error getting download URL');
      }
    });

    // Write the file data to Firebase Storage
    fileStream.end(file.buffer);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('Error uploading file');
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


// const express = require('express');
// const admin = require('firebase-admin');
// const multer = require('multer');
// const path = require('path');

// const app = express();
// const port = 3000;

// // Initialize Firebase Admin SDK with service account credentials
// const serviceAccount = require('./serviceAccountKey.json'); // Replace with the path to your service account key JSON file
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   storageBucket: 'gs://herb-cartel.appspot.com' // Replace with your Firebase Storage bucket URL
// });

// // Get a reference to the Firebase Storage service
// const storage = admin.storage();
// const bucket = storage.bucket();

// // Configure multer for handling file uploads
// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 10 * 1024 * 1024 // 10 MB max file size (adjust as needed)
//   }
// });

// // POST endpoint for uploading images
// app.post('/upload', upload.single('image'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).send('No file uploaded.');
//     }

//     // Generate a unique filename
//     const filename = Date.now() + '-' + path.basename(req.file.originalname);

//     // Upload file to Firebase Storage
//     const fileUpload = bucket.file(filename);
//     const fileStream = fileUpload.createWriteStream({
//       metadata: {
//         contentType: req.file.mimetype
//       }
//     });

//     fileStream.on('error', (err) => {
//       console.error('Error uploading to Firebase:', err);
//       res.status(500).send('Error uploading file to Firebase');
//     });

//     fileStream.on('finish', () => {
//       // Get image download URL
//       const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
//       res.status(200).json({ imageUrl: imageUrl });
//     });

//     // Pipe file buffer to Firebase Storage
//     fileStream.end(req.file.buffer);
//   } catch (error) {
//     console.error('Error uploading:', error);
//     res.status(500).send('Internal server error');
//   }
// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

