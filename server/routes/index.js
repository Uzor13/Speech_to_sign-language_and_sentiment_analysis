const express = require('express');
const router = express.Router();
const getSignVideos = require('../controllers/getVideosFromDB')
const getVideoPath = require('../controllers/getVideoPath')


router.post('/api/video', getVideoPath)

router.get('/api/videos/:name', getSignVideos)



module.exports = router;
