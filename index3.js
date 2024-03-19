const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies

// MongoDB connection URI
const uri = 'mongodb+srv://ritheshp11:admin@herbcartel.bilcy0r.mongodb.net/'; // Change this to your MongoDB URI
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let db; // Database reference

// Connect to MongoDB
async function connectToMongo() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db('herbel_cartel'); // Change 'your-database-name' to your database name
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Exit the process if unable to connect to MongoDB
  }
}

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


// Start the server
async function startServer() {
  await connectToMongo();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
