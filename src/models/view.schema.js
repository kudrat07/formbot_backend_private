const mongoose = require('mongoose');

const viewSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, required: true,},
  views: { type: Number, default: 0 }
});

const View = mongoose.model('View', viewSchema);

module.exports = View;
