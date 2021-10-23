const router = require('express').Router();
const Room = require('../models/room');

router.get('/clearAll', (req, res) => {
  Room.deleteMany({}, (err, data) => {
    return res.status(200).json({
      status: err ? "Failed" : "Success",
      ack: err || data
    })
  });
});

router.get('/getAll', (req, res) => {
  Room.find({}, (err, data) => {
    return res.status(200).json({
      status: err ? "Failed" : "Success",
      info: err || data
    })
  });
});

router.get('/getGuests/:id', (req, res) => {
  Room.findOne({ 'roomId': req.params.id || "" }, (err, data) => {
    return res.status(200).json({
      status: err ? "Failed" : "Success",
      info: err || data
    })
  });
});

module.exports = router;
