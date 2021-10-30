const router = require('express').Router();
const Room = require('../models/room');
const User = require('../models/user');

router.delete('/meetings', (req, res) => {
  Room.deleteMany({}, (err, data) => {
    return res.status(200).json({
      status: err ? "Failed" : "Success",
      ack: err || data
    })
  });
});

router.get('/meetings', (req, res) => {
  Room.find({}, (err, data) => {
    return res.status(200).json({
      status: err ? "Failed" : "Success",
      info: err || data
    })
  });
});

router.delete('/users', (req, res) => {
  User.deleteMany({}, (err, data) => {
    return res.status(200).json({
      status: err ? "Failed" : "Success",
      ack: err || data
    })
  });
});

router.get('/users', (req, res) => {
  User.find({}, (err, data) => {
    return res.status(200).json({
      status: err ? "Failed" : "Success",
      info: err || data
    })
  });
});

module.exports = router;
