const router = require('express').Router();
const User = require('../models/user');
const sha1 = require('sha1');
const { handle400Error, handleError, generateToken, handle200Error } = require('../utils/utils');

router.post('/register', (req, res) => {
    if (!req.body.email)
        return handle400Error(res);
    if (!req.body.password)
        return handle400Error(res);
    new User({
        name: req.body.name,
        email: req.body.email,
        password: sha1(req.body.password)
    }).save((err, savedUser) => {
        if (err) {
            return handleError(res);
        }
        return res.status(200).json({ status: 1, data: savedUser._id, msg: 'Registration Successful' })
    });
});

router.post('/login', (req, res) => {
    if (!req.body.email)
        return handle400Error(res);
    if (!req.body.password)
        return handle400Error(res);
    User.findOne({ email: req.body.email }, (err, user) => {
        if (err) {
            return handleError(res);
        }
        if(!user) {
            return handle200Error(res, "Unregistered Email ID!");
        }
        if(user.password != sha1(req.body.password)) {
            return handle200Error(res, "Incorrect Password!");
        }
        generateToken({
            name: user?.name,
            email: user.email,
            id: user._id,
            displayPic: user?.displayPic
        }, result => {
            if (result.status) {
                return res.status(200).json({ status: 1, token: result.token, msg: 'Login Successful' });
            } else {
                return res.status(401).json({ status: 0, error: result.err, msg: 'Login Failed' });
            }
        })
    });
});

module.exports = router;
