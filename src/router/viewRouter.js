const express = require('express');
const viewRouter = express.Router();
const View = require('../models/view.schema');

viewRouter.post('/form/view/:formId', async (req, res) => {
  const { formId } = req.params;

  if (!formId) {
    return res.status(400).json({ error: 'Form ID is required.' });
  }

  try {
    const view = await View.findOneAndUpdate(
      { formId },
      { $inc: { views: 1 } },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, data: view });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating views.' });
  }
});
viewRouter.get('/form/view/:formId', async (req, res) => {
    const { formId } = req.params;
  
    if (!formId) {
      return res.status(400).json({ error: 'Form ID is required.' });
    }
  
    try {
      const view = await View.findOne({ formId });
  
      if (!view) {
        return res.status(200).json({ error: 'Form not found.' });
      }
  
     return  res.status(200).json({ success: true, data: view });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while fetching the view count.' });
    }
  });
  

module.exports = viewRouter;
