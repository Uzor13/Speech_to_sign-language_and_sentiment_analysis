const mongoose = require('mongoose')

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useCreateIndex: true,
                autoIndex: true,
                useFindAndModify: false
            },
            (err => {
                if (err) return new Error('Failed to connect to the database')
                console.log('Connected to the database')
            })
        )
    } catch (e) {
        console.log(e.message)
    }
}

module.exports = connectDB