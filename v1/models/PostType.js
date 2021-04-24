const mongoose = require('mongoose'); 

const postTypeSchema = new mongoose.Schema({
    title: {type:String , required:true},
    description: {type: String, required: true},
    created: {type: String},
    lastUpdated: {type: String}
})

module.exports = mongoose.model('Category', postTypeSchema);

