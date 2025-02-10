const express = require("express");
const userAuth = require("../middlewares/userAuth");
const Folder = require("../models/folder.schema");
const mongoose = require("mongoose")
const Form = require("../models/form.schema")

const folderRouter = express.Router();

folderRouter.post("/folder/:userId", userAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { name } = req.body;
    if (!mongoose.isValidObjectId(userId)) {
        return res.status(400).json({ message: "Invalid userId format" });
      }
    if (!userId) {
     return res.status(400).json({ message: "userId is required" });
    }
    if (!name) {
      return res.status(400).json({ message: "Folder name is required." });
    }

    const existingFolder = await Folder.findOne({ name, userId });
    if (existingFolder) {
      return res
        .status(400)
        .json({ message: `Folder with the name "${name}" already exists.` });
    }
    const folder = new Folder({
      name,
      userId,
    });
    await folder.save();
    return res.status(201).json({ message: "Folder created successfully",
        folder
     });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "failed to create folder", error: error.message });
  }
});

folderRouter.get("/folder/:userId", userAuth, async (req, res) => {
    try {
      const { userId } = req.params;
  
      if (!mongoose.isValidObjectId(userId)) {
        return res.status(400).json({ message: "Invalid userId format" });
      }
  
      const folders = await Folder.find({ userId });
      if (!folders || folders.length === 0) {
        return res.status(200).json({ message: "No folders found for this user" });
      }
      return res.status(200).json({ message: "Folders fetched successfully", folders });
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch folder(s)", error: error.message });
    }
  });
folderRouter.delete("/folder/:folderId", userAuth, async (req, res) => {
    try {
      const { folderId } = req.params;
  
      if (!mongoose.isValidObjectId(folderId)) {
        return res.status(400).json({ message: "Invalid folderId format" });
      }
  
      const folder = await Folder.findByIdAndDelete(folderId);
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      const deletedForms = await Form.deleteMany({ folderId });
      return res.status(200).json({ message: "Folders deleted successfully", folder });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete folder", error: error.message });
    }
  });

module.exports = folderRouter;
