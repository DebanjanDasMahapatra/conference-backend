const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const { logToConsole } = require('./utils/utils');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then(success => {
    logToConsole("SUCCESS", "Database Connected");
}).catch(error => {
    logToConsole("DANGER", "MongoDB connection error. Please make sure that MongoDB is running.");
    console.log(error);
    process.exit(1);
});

app.use('/', require('./routes/index'));
app.use('/admin', require('./routes/admin'));

module.exports = app;
