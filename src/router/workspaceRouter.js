const express = require('express');
const mongoose = require('mongoose');
const Workspace = require('../models/workspace.schema');
const User = require('../models/user.schema');
const workspaceRouter = express.Router();
const userAuth = require("../middlewares/userAuth")
require("dotenv").config()

workspaceRouter.post('/workspaces',userAuth, async (req, res) => {
  try {
    const { owner, folders = [], forms = [], sharedBy, sharedWith = [] } = req.body;

    if (!owner) {
      return res.status(400).json({ success: false, message: 'Owner is required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(owner)) {
      return res.status(400).json({ success: false, message: 'Invalid owner ID.' });
    }

    const ownerDetails = await User.findById(owner);
    if (!ownerDetails) {
      return res.status(404).json({ success: false, message: 'Owner not found.' });
    }

    if (sharedBy && !['link', 'email'].includes(sharedBy)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sharedBy value. It must be either "link" or "email".',
      });
    }

    if (!Array.isArray(folders) || !folders.every(id => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ success: false, message: 'Folders must be an array of valid IDs.' });
    }
    if (!Array.isArray(forms) || !forms.every(id => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ success: false, message: 'Forms must be an array of valid IDs.' });
    }

    const resolvedSharedWith = [];
    for (const item of sharedWith) {
      const { email, permission } = item;

      if (!['view', 'edit'].includes(permission)) {
        return res.status(400).json({
          success: false,
          message: 'Each sharedWith entry must include a valid permission ("view" or "edit").',
        });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ success: false, message: `User with email ${email} not found.` });
      }

      resolvedSharedWith.push({ user: user._id, permission });
    }

    const workspaceName = ownerDetails.name;

    const mergeUnique = (existing, incoming) => {
      const set = new Set(existing.map(id => id.toString()));
      incoming.forEach(id => set.add(id.toString()));
      return Array.from(set);
    };

    let workspace = await Workspace.findOne({ owner });

    if (workspace) {
      workspace.folders = mergeUnique(workspace.folders, folders);
      workspace.forms = mergeUnique(workspace.forms, forms);
      workspace.sharedBy = sharedBy;

      const sharedWithMap = new Map(
        workspace.sharedWith.map(item => [item.user.toString(), item])
      );
      resolvedSharedWith.forEach(item => {
        sharedWithMap.set(item.user.toString(), item);
      });
      workspace.sharedWith = Array.from(sharedWithMap.values());

      await workspace.save();
      return res.status(200).json({
        success: true,
        message: 'Workspace updated successfully.',
        workspace,
      });
    }

    workspace = new Workspace({
      name: workspaceName,
      owner,
      folders,
      forms,
      sharedBy,
      sharedWith: resolvedSharedWith,
    });
    await workspace.save();

    return res.status(201).json({
      success: true,
      message: 'Workspace created successfully.',
      workspace,
    });
  } catch (error) {
    console.error('Error creating/updating workspace:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while creating/updating the workspace.',
    });
  }
});



workspaceRouter.get('/workspaces/:userId', userAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId format.' });
    }

    const workspaces = await Workspace.find({ 'sharedWith.user': userId })
      .populate('folders') 
      .populate('forms')    
      .populate('sharedWith.user'); 

    if (!workspaces || workspaces.length === 0) {
      return res.status(200).json({ success: false, message: 'No workspaces found for the specified user.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Workspaces fetched successfully.',
      workspaces,
    });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching the workspaces.',
    });
  }
});



workspaceRouter.delete('/workspaces/:userId/items/:itemId',userAuth, async (req, res) => {
  try {
    const { userId, itemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ success: false, message: 'Invalid workspace or item ID.' });
    }

    const workspace = await Workspace.findOne({ owner:userId });
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found.' });
    }

    const isFolder = workspace.folders.includes(itemId);
    const isForm = workspace.forms.includes(itemId);

    if (!isFolder && !isForm) {
      return res.status(404).json({ success: false, message: 'Item not found in workspace.' });
    }

    const update = {};
    if (isFolder) {
      update.$pull = { folders: itemId };
    }

    if (isForm) {
      update.$pull = { forms: itemId };
    }

    const updatedWorkspace = await Workspace.findByIdAndUpdate(workspace._id, update, {
      new: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Item deleted successfully from the workspace.',
      workspace: updatedWorkspace,
    });
  } catch (error) {
    console.error('Error deleting item from workspace:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the item from the workspace.',
    });
  }
});

workspaceRouter.get('/share/workspace/:workspaceId', userAuth, async (req, res) => {
  try {
    const { workspaceId } = req.params; 
    const { mode } = req.query; 
    const currentUser = req.user;

    console.log("Received mode:", mode);

    if (!currentUser) {
      return res.status(401).json({ message: "User is not authenticated." });
    }

    if (!mongoose.isValidObjectId(workspaceId)) {
      return res.status(400).json({ message: "Invalid workspaceId format." });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found." });
    }

    if (workspace.owner.toString() === currentUser._id.toString()) {
      return res.status(400).json({
        message: "You cannot share the workspace with yourself.",
      });
    }

    if (!['view', 'edit'].includes(mode)) {
      return res.status(400).json({
        message: "Invalid mode. Mode must be 'view' or 'edit'.",
      });
    }


    const existingAccess = workspace.sharedWith.find(
      sharedUser => sharedUser.user.toString() === currentUser._id.toString()
    );

    if (existingAccess) {
      if (existingAccess.permission !== mode) {
        existingAccess.permission = mode;
        await workspace.save();
        return res.status(200).json({
          status:"200",
          message: `Permission updated to '${mode}' for the workspace.`,
          workspace,
        });
      }

      return res.status(200).json({
        status:"200",
        message: `You already have '${mode}' access to this workspace.`,
        workspace,
      });
    }

    workspace.sharedWith.push({ user: currentUser._id, permission: mode });
    await workspace.save();

    return res.status(201).json({
      status:"200",
      message: `Access granted with '${mode}' permission to the workspace.`,
      workspace,
    });
  } catch (error) {
    console.error(`Error adding user to workspace:`, error.message);
    return res.status(500).json({
      status:"400",
      message: "An error occurred while granting access to the workspace.",
      error: error.message,
    });
  }
});



workspaceRouter.get('/share/dashboard/:mode', userAuth, async (req, res) => {
  try {
    const currentUser = req.user._id;

    if (!currentUser) {
      return res.status(401).json({ message: "User is not authenticated." });
    }

    const workspace = await Workspace.findOne({ owner: currentUser });
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found." });
    }

    const { mode } = req.params;
    if (!['edit', 'view'].includes(mode)) {
      return res.status(400).json({ message: "Invalid mode. Use 'edit' or 'view'." });
    }

    const shareableLink = `${process.env.FRONTEND_URL}/share/dashboard/${workspace._id}?mode=${mode}`;

    return res.status(200).json({
      message: "Shareable link created",
      shareableLink,
    });
  } catch (error) {
    console.error("Error creating shareable link:", error.message);
    return res.status(500).json({
      message: "An error occurred while creating the shareable link.",
      error: error.message,
    });
  }
});


module.exports = workspaceRouter;
