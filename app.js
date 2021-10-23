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

mongoose.connect(process.env.MONGODB_URI, { useFindAndModify: false, useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }, () => {
    logToConsole("SUCCESS", "Database Connected");
});
mongoose.connection.on('error', () => {
    logToConsole("DANGER", "MongoDB connection error. Please make sure that MongoDB is running.");
    process.exit(1);
});

app.use('/', require('./routes/index'));
app.use('/admin', require('./routes/admin'));

module.exports = app;
