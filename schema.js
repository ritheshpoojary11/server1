const mongoose = require("mongoose");

const ImageSchema = mongoose.Schema({
  filepath: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Image", ImageSchema);
