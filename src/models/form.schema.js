const mongoose = require("mongoose")

const formSchema = new mongoose.Schema({
  name: { type: String, required: true },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    default: null,
  },
    userId:{
          type:mongoose.Schema.Types.ObjectId,
          ref:"User",
          required:true
      }
});

module.exports = mongoose.model("Form", formSchema);
