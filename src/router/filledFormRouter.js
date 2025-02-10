const express = require("express");
const filledFormRouter = express.Router();
const FilledForm = require("../models/filledForm.schema");
const userAuth = require("../middlewares/userAuth");

filledFormRouter.post("/filled/forms", async (req, res) => {
  const { formId, responses } = req.body;

  if (!formId || !responses || !Array.isArray(responses)) {
    return res.status(400).json({
      message: "Invalid input. 'formId' and 'responses' are required.",
    });
  }

  try {
    const filledForm = new FilledForm({ formId, responses });
    await filledForm.save();
    res.status(201).json({ message: "Form created successfully!", filledForm });
  } catch (error) {
    console.error("Error creating form:", error);
    res.status(500).json({ message: "Error creating form.", error });
  }
});


filledFormRouter.patch("/filled/forms/:id", async (req, res) => {
  const { responses, completed } = req.body;

  if (!Array.isArray(responses)) {
    return res.status(400).json({ message: "'responses' must be an array." });
  }

  try {
    const filledForm = await FilledForm.findById(req.params.id);

    if (!filledForm) {
      return res.status(404).json({ message: "Filled form not found." });
    }

    responses.forEach((newResponse) => {
      const existingResponse = filledForm.responses.find(
        (resp) => resp.elementId === newResponse.elementId
      );
      if (existingResponse) {
        existingResponse.response = newResponse.response;
      } else {
        filledForm.responses.push(newResponse);
      }
    });

    if (typeof completed === "boolean") {
      filledForm.completed = completed;
    }

    await filledForm.save();

    res.status(200).json({
      message: "Form updated successfully!",
      filledForm,
    });
  } catch (error) {
    console.error("Error updating form:", error);
    res.status(500).json({ message: "Error updating form", error });
  }
});

filledFormRouter.get("/filled/forms/:formId",async (req, res) => {
  const { formId } = req.params;

  try {
    const filledForm = await FilledForm.find({ formId });

    if (!filledForm) {
      return res.status(404).json({ message: "Form not found." });
    }

    res.status(200).json({
      message: "Form retrieved successfully!",
      filledForm,
    });
  } catch (error) {
    console.error("Error retrieving form:", error);
    res.status(500).json({ message: "Error retrieving form.", error });
  }
});


module.exports = filledFormRouter;
