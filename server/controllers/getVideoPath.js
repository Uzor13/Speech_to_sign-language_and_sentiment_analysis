const VideoModel = require('../models/signLanguage')

const getVideoPath = async (req, res) => {
    const {name, videoPath} = req.body


    try {
        const video = new VideoModel({
            name,
            videoPath
        })
        await video.save()
        return res.json({
            status: 'Success',
            data: {
                name,
                videoPath
            }
        })
            .catch(e => e.message)
    } catch (e) {
        res.status(400).send(e.message)
    }



}

module.exports = getVideoPath