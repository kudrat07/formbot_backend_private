const mongoose = require("mongoose");



const ResponseSchema = new mongoose.Schema({
    elementId: { 
        type: String, 
        required: true,
        index: true,
    },
    type: { 
        type: String, 
        enum: ["bubble", "inputType","bubbleText","bubbleImage","inputText","inputNumber","inputEmail","inputPhone","inputDate","inputRating","inputButton"], 
        required: true 
    },
    content: { 
        type: String, 
    },
    response: { 
        type: String, 
        default: null,
    },
}, { _id: false }); 


const FilledFormSchema = new mongoose.Schema({
    formId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Form", 
        required: true,
        index: true, 
    },
    responses: [ResponseSchema], 
    completed: { type: Boolean, default: false },
}, {
    timestamps:true,
});

const FilledForm = mongoose.model("FilledForm", FilledFormSchema);

module.exports = FilledForm;
