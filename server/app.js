const express = require('express');
const path = require('path');
const dotenv = require('dotenv')
const connectDB = require('./db/connectDB')
const cors = require('cors');

//Dotenv config
dotenv.config()


connectDB().catch(e => console.log(e.message));


const app = express();

const port = process.env.PORT || 5000

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`)
})

//Middlewares
app.use(express.json());
app.use(cors())
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'))

//Routes Middleware
const indexRouter = require('./routes/index');
app.use('/', indexRouter);

module.exports = app;
