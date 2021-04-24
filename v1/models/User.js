const mongoose = require('mongoose'); 

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true},
    email: { type: String, required: true},
    password: { type: String, required: true},
    phone: { type: String} ,
    profileImage: { type: String },  
    address: {type: String } ,
    city: { type: String },
    state: { type: String },
    zip: { type: String },
    website: {type: String},
    created: {type: String},
    lastUpdated: {type: String}


})

module.exports = mongoose.model('User', userSchema);
