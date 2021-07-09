const mongoose = require('mongoose')

const videoModel = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    videoPath: {
        type: String,
        required: true,
        unique: true
    }
})

module.exports = mongoose.model('videoModel', videoModel)