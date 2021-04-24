const mongoose = require('mongoose'); 

const categorySchema = new mongoose.Schema({
    title: {type:String  },
    description: {type: String},
    created: {type: String},
    lastUpdated: {type: String}
})

module.exports = mongoose.model('Category', categorySchema);

