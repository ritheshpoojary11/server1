const express = require('express');
const { MongoClient } = require('mongodb');
const multer = require('multer');
const admin = require('firebase-admin');
const cors = require('cors');
const nodemailer = require('nodemailer');
const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert('./serviceAccountKey.json'),
  storageBucket: 'gs://herbal-cartel.appspot.com'
});

// Initialize Firebase Storage
const storage = admin.storage();
const bucket = storage.bucket();

// Initialize MongoDB connection
const uri = 'mongodb+srv://ritheshp11:admin@herbcartel.bilcy0r.mongodb.net/herbel_cartel';
const mongoose = require('mongoose');
mongoose.connect(uri);
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

async function fetchData(collectionName, searchTerm = "", category = "") {
  const uri = 'mongodb+srv://ritheshp11:admin@herbcartel.bilcy0r.mongodb.net/?retryWrites=true&w=majority'; // Replace with your MongoDB URI
  const client = new MongoClient(uri);

  try {
    await client.connect();

    const database = client.db('herbel_cartel');
    const collection = database.collection(collectionName);
    
    let pipeline = [
      { $lookup: { from: 'Plants', localField: 'plant_id', foreignField: 'plant_id', as: 'plantInfo' } },
      { $unwind: '$plantInfo' },
      { $lookup: { from: 'plants_properties', localField: 'plant_id', foreignField: 'plant_id', as: 'plantDetInfo' } },
      { $unwind: '$plantDetInfo' },
      { $lookup: { from: 'Images', localField: 'plant_id', foreignField: 'plant_id', as: 'image' } },
      { $unwind: '$image' }
    ];

    if (searchTerm) {
      pipeline.push({
        $match: {
          $or: [
            { 'plantInfo.scientific_name': { $regex: new RegExp(searchTerm, 'i') } },
            { 'plantInfo.introduction': { $regex: new RegExp(searchTerm, 'i') } },
            { 'english': { $regex: new RegExp(searchTerm, 'i') } },
            { 'plantDetInfo.uses': { $regex: new RegExp(searchTerm, 'i') } },
            { 'plantDetInfo.additional_info': { $regex: new RegExp(searchTerm, 'i') } },
            { 'plantDetInfo.demerits': { $regex: new RegExp(searchTerm, 'i') } }
          ]
        }
      });
    }
    
    if (category) {
      pipeline.push({ $match: { 'plantInfo.category': category } });
    }

    const result = await collection.aggregate(pipeline).toArray();
    //console.log('Fetched data:', result);
    //console.log('Pipeline:', pipeline);
    return result;
  } catch (err) {
    console.error('Error fetching data:', err);
  } finally {
    await client.close();
  }
}

app.get('/Home', async (req, res) => {
  const searchTerm = req.query.search || "";
  const Plants = await fetchData('Plants_name', searchTerm);
  res.json(Plants);
});

app.get('/Gallery', async (req, res) => {
  const searchTerm = req.query.search || "";
  const Plants = await fetchData('Plants_name', searchTerm);
  res.json(Plants);
});

app.get('/Herbs', async (req, res) => {
  const searchTerm = req.query.search || "";
  const Plants = await fetchData('Plants_name', searchTerm, 'Herb');
  res.json(Plants);
});

app.get('/Shrubs', async (req, res) => {
  const searchTerm = req.query.search || "";
  const Plants = await fetchData('Plants_name', searchTerm, 'Shrub');
  res.json(Plants);
});

app.get('/Trees', async (req, res) => {
  const searchTerm = req.query.search || "";
  const Plants = await fetchData('Plants_name', searchTerm, 'Tree');
  res.json(Plants);
});
// Route to get all plants from MongoDB
app.get('/Admin', async (req, res) => {
  try {
    const plants = await db.collection('AdditionalPlants').find().toArray();
    res.status(200).json(plants);
  } catch (error) {
    console.error('Error fetching plants:', error);
    res.status(500).json({ error: 'Error fetching plants' });
  }
});
// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'herbalcartel2024@gmail.com',
    pass: 'ddeb mfvq bhxb kqsd'
  }
});

// Route to delete a plant from MongoDB
app.post('/deleteData', async (req, res) => {
  const { name, email } = req.body;
  console.log('Attempting to delete plant with name:', name);
  try {
    // Extract name and email from request body

    // Check if the 'name' field is provided in the request body
    if (!name) {
      return res.status(400).json({ error: 'Name field is required' });
    }

    console.log('Attempting to delete plant with name:', name);

    // Attempt to delete the document from the MongoDB collection
    const result = await db.collection('AdditionalPlants').deleteOne({ name: name });

    // Check if the document was successfully deleted
    if (result.deletedCount === 1) {
      console.log('Plant deleted successfully:', name);

      // Send email notification
      const mailOptions = {
        from: 'herbalcartel2024@gmail.com',
        to: email, // Correct interpolation of email variable
        subject: 'Update on Your Plant Information Submission!',
        html: `
        <pre>Dear ${name},

We appreciate your effort in submitting plant information to our website. However, after careful review, we regret to inform you that your submission did not meet our current standards for publication.

Reasons for rejection may include:

Incomplete or inaccurate information provided.
Lack of clarity or organization in the submission.

We understand that receiving this news may be disappointing. However, we see this as an opportunity for collaboration and growth. We encourage you to carefully review and consider how you can enhance your submission to align more closely with our standards. Your dedication to improving your contribution is greatly appreciated and valued."

Best regards,
Team
Herbal Cartel</pre>`
      };

      // Send email using configured transporter
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.error('Error sending email:', error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });

      return res.status(200).json({ message: 'Plant deleted successfully' });
    } else {
      // If no document was deleted, it means the plant was not found
      console.log('Plant not found:', name);
      return res.status(404).json({ error: 'Plant not found' });
    }
  } catch (error) {
    // Handle any errors that occur during the deletion process
    console.error('Error deleting plant:', error);
    return res.status(500).json({ error: 'Error deleting plant' });
  }
});



// Route to insert data into MongoDB
// app.post('/insertData', async (req, res) => {
//   try {
//     const { plantId } = req.body;
//     await db.collection('AdditionalPlants').insertOne({ _id: ObjectId(plantId) });
//     res.status(200).json({ message: 'Plant inserted successfully' });
//   } catch (error) {
//     console.error('Error inserting plant:', error);
//     res.status(500).json({ error: 'Error inserting plant' });
//   }
// });
app.post('/insertData', async (req, res) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    // Fetch the maximum plantId from the collection
    const maxPlant = await db.collection('Plants').aggregate([
      {
        $group: {
          _id: null,
          maxPlantId: { $max: { $toInt: "$plant_id" } } // Convert plant_id to integer and find the maximum value
        }
      }
    ]).toArray();
    
    let maxPlantId = maxPlant.length > 0 ? maxPlant[0].maxPlantId : 0;
    
    // Increment the maximum plantId by 1 to generate the new plantId
    const newPlantId = (maxPlantId + 1).toString();
    
    // Insert data into Collection1 (Plants)
    await db.collection('Plants').insertOne({ plant_id: newPlantId, scientific_name: req.body.scientificName, introduction: req.body.information, category: req.body.category });

    // Insert data into Collection2 (Images)
    await db.collection('Images').insertOne({ plant_id: newPlantId, images: req.body.imageUrl });

    // Insert data into Collection3 (Plants_name)
    await db.collection('Plants_name').insertOne({ plant_id: newPlantId, english: req.body.plantName, kannada: req.body.kannada, hindi: req.body.hindi, telugu: req.body.telugu, tamil: req.body.tamil });

    // Insert data into Collection4 (Plants_properties)
    await db.collection('plants_properties').insertOne({ plant_id: newPlantId, uses: req.body.uses, additional_info: req.body.information, demerits: req.body.demerits });
    await db.collection('AdditionalPlants').deleteOne({ name: req.body.name });
    const mailOptions = {
      from: 'herbalcartel2024@gmail.com',
      to: email, // Correct interpolation of email variable
      subject: 'Your Plant Information Has Been Approved!',
      html: `
      <pre>Dear ${name},

      We're excited to share that your submitted plant information has been successfully approved by our team and is now live on our website. Thank you for contributing to our community of plant enthusiasts!
      
      Your dedication to sharing your plant knowledge with our community is truly commendable, and we're grateful for your contribution. Your submission has met our standards and will now be accessible to our audience, helping fellow plant enthusiasts learn and grow.
      
      Happy gardening!
      
      Best regards,
      Team
      Herbal Cartel</pre>`
    };

    // Send email using configured transporter
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

    res.status(200).json({ message: 'Data inserted successfully into all collections' });
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).json({ error: 'Error inserting data' });
  }
});

//update data
app.post('/updateData', async (req, res) => {
  try {
    // Extract updated data from request body
    const { plantName, scientificName, category, imageUrl, information, kannada, hindi, telugu, tamil, uses, demerits } = req.body;

    // Update the corresponding document in the database
    // Example code: Update the document in the 'Plants' collection
    const result = await db.collection('AdditionalPlants').updateOne(
      { plantName: plantName }, // Find document by plant_id
      { $set: { scientificName, category, imageUrl, information, kannada, hindi, telugu, tamil, uses, demerits } } // Update fields
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: 'Data updated successfully' });
    } else {
      res.status(404).json({ error: 'Plant not found or data unchanged' });
    }
  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).json({ error: 'Error updating data' });
  }
});
app.get('/', (req, res) => {
  res.send('Hi');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

