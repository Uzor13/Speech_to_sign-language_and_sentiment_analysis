const VideoModel = require('../models/signLanguage')

const getVideosFromDB = async (req, res, next) => {
    try {
        const video = await VideoModel.findOne({name: req.params.name})

        return res.json({
            status: "success",
            data: video
        })
    }
    catch (e) {
        res.status(400).json({
            status: 'Error',
            message: 'No video available for this word'
        })
    }
}

module.exports = getVideosFromDB