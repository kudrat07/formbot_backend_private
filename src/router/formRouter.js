const express = require("express");
const userAuth = require("../middlewares/userAuth");
const Folder = require("../models/folder.schema");
const Form = require("../models/form.schema")
const CreateForm = require("../models/createForm.schema")
const mongoose = require("mongoose")

const formRouter = express.Router()

formRouter.post("/form/:userId", userAuth, async (req, res) => {
    try {
      const { name, folderId } = req.body;
      const userId = req.params.userId
  
      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }
  
      if (folderId && !mongoose.isValidObjectId(folderId)) {
        return res.status(400).json({ message: "Invalid folderId format" });
      }

      if (!name) {
        return res.status(400).json({ message: "Folder name is required." });
      }
  
      const existingForm = await Form.findOne({ name, userId });
      if (existingForm) {
        return res
          .status(400)
          .json({ message: `Form with the name "${name}" already exists.` });
      }

      const form = new Form({
        name,
        folderId: folderId || null,
        userId,
      });
  
      await form.save();
  
      return res.status(201).json({ message: "Form created successfully", form });
    } catch (error) {
      return res.status(500).json({ message: "Failed to create form", error: error.message });
    }
  });
  formRouter.get("/form/:userId", userAuth, async (req, res) => {
    try {
      const { userId } = req.params; 
      const { folderId } = req.query; 

      if (!mongoose.isValidObjectId(userId)) {
        return res.status(400).json({ message: "Invalid userId format" });
      }
  
      let filter = { userId };
  
      if (folderId) {
        if (!mongoose.isValidObjectId(folderId)) {
          return res.status(400).json({ message: "Invalid folderId format" });
        }
        filter.folderId = folderId;
      } else {
        filter.folderId = null;
      }

      const forms = await Form.find(filter);
      return res.status(200).json({ message: "Forms fetched successfully", forms });
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch forms", error: error.message });
    }
  });

  formRouter.delete("/form/:userId/:formId", userAuth, async (req, res) => {
    try {
      const { userId, formId } = req.params;
  
      if (!mongoose.isValidObjectId(userId)) {
        return res.status(400).json({ message: "Invalid userId format" });
      }
  
      if (!mongoose.isValidObjectId(formId)) {
        return res.status(400).json({ message: "Invalid formId format" });
      }
  
      const deletedForm = await Form.findOneAndDelete({ userId, _id: formId });
      await CreateForm.findOneAndDelete({formId})
      if (!deletedForm) {
        return res.status(404).json({ message: "No form found with the specified userId and formId" });
      }
  
      return res.status(200).json({ message: "Form deleted successfully", form: deletedForm });
    } catch (error) {
      return res.status(500).json({ 
        message: "An error occurred while deleting the form", 
        error: error.message 
      });
    }
  });
  

module.exports = formRouter