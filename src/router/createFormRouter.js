const express = require("express");
const createFormRouter = express.Router();
const CreateForm = require("../models/createForm.schema");
const userAuth = require("../middlewares/userAuth");
require("dotenv").config();

createFormRouter.post("/create/forms", userAuth, async (req, res) => {
  try {
    const { formId, name, elements } = req.body;

    if (!formId || !name || !Array.isArray(elements) || elements.length === 0) {
      return res
        .status(400)
        .json({
          message:
            "Invalid form data. formId, name, and elements are required.",
        });
    }

    for (const element of elements) {
      if (!(element.bubble || element.inputType)) {
        return res.status(400).json({
          message: "Each element must have either bubble or inputType.",
        });
      }

      if (!element.id) {
        return res.status(400).json({
          message: "Each element must have content and id.",
        });
      }
    }

    const newForm = new CreateForm({ formId, name, elements });
    await newForm.save();

    res
      .status(201)
      .json({ message: "Form created successfully!", form: newForm });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating form.", error: error.message });
  }
});

createFormRouter.get("/create/forms/:formId", userAuth, async (req, res) => {
  const { formId } = req.params;

  try {
    const form = await CreateForm.findOne({ formId });

    if (!form) {
      return res.status(200).json({ message: "Form not found." });
    }

    res.status(200).json({ message: "Form fetched successfully!", form });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching form.", error: error.message });
  }
});

createFormRouter.get(
  "/create/forms/:formId/link",
  userAuth,
  async (req, res) => {
    const { formId } = req.params;

    try {
      const fillForm = await CreateForm.findOne({ formId });

      if (!fillForm) {
        return res.status(404).json({ message: "Form not found." });
      }

      const formLink = `${process.env.FRONTEND_URL}/fill/form/${formId}/${fillForm._id}`;

      res.status(200).json({
        message: "Form link generated successfully!",
        formLink,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error generating form link.", error: error.message });
    }
  }
);
createFormRouter.get("/fill/forms/:createFormId", async (req, res) => {
  const { createFormId } = req.params;

  try {
    const getFillForm = await CreateForm.findOne({ _id: createFormId });

    if (!getFillForm) {
      return res.status(404).json({ message: "Form not found." });
    }

    res.status(200).json({
      message: "Fill Form fetched successfully!",
      getFillForm,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error generating form link.", error: error.message });
  }
});
module.exports = createFormRouter;
