const mongoose = require('mongoose'); 

const postSchema = new mongoose.Schema({
    userId: { type: String, required: true},
    postType: { type: String, required: true},
    title: {type:String , required:true},
    description: {type: String, required: true},
    category: {type : String },
    email: { type: String, required: true},
    address: { type: String} ,
    phone: { type: String} ,
    postImage: { type: String },  
    city: { type: String },
    state: { type: String },
    zip: { type: String },
    website: { type: String },
    activated: {type : String },
    website: {type: String},
    created: {type: String},
    lastUpdated: {type: String},
    dateCreated: { type: String}
   

})

module.exports = mongoose.model('Post', postSchema);