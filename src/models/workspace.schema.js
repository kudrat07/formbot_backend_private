const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  sharedWith: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      permission: { type: String, enum: ['view', 'edit'],},
    },
  ],
  folders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Folder' }],
  forms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Form' }],
});

module.exports = mongoose.model('Workspace', workspaceSchema);
