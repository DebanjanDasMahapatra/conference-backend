const uniqid = require('uniqid');
const JWT = require('jsonwebtoken');

const getNewMeetingId = () => {
    return uniqid();
}

const getNewRoomId = (userName) => {
    const rid = Buffer.from(userName).toString('base64');
    return uniqid(rid.substring(0, rid.length - 2));
}

const getNewUserId = () => {
    return uniqid.process();
}

const getNewKey = () => {
    return uniqid.time();
}

const handleError = (res) => {
    return res.status(500).json({
        'err': "Internal Server Error"
    });
}

const handle200Error = (res, msg = "Internal Server Error") => {
    return res.status(200).json({
        'status': 0,
        'msg': msg
    });
}

const handle400Error = (res, msg = "Required data missing") => {
    return res.status(400).json({
        'status': 0,
        'msg': msg
    });
}

const handle401Error = (res, msg = "Unauthorized") => {
    return res.status(401).json({
        'status': 0,
        'msg': msg
    });
}

const getPersonalRoomId = (to, from) => {
    /**
     * Personal Room ID formation:
     * from: 1, to: 2
     * 1_2 and 2_1 should be same
     */
    return to < from ? to + '_' + from : from + '_' + to;
}

/**
 * 
 * @param {('DANGER' | 'INFO' | 'SUCCESS' | 'WARNING' | 'PLEASANT')} type
 * @param {string} message 
 * @returns 
 */
const logToConsole = (type, message) => {
    let
    FgRed = "\x1b[31m%s\x1b[0m",
    FgGreen = "\x1b[32m%s\x1b[0m",
    FgYellow = "\x1b[33m%s\x1b[0m",
    FgMagenta = "\x1b[35m%s\x1b[0m",
    FgCyan = "\x1b[36m%s\x1b[0m";
    switch(type) {
        case 'DANGER':
            console.log(FgRed, message);
            return;
        case 'WARNING':
            console.log(FgYellow, message);
            return;
        case 'SUCCESS':
            console.log(FgGreen, message);
            return;
        case 'INFO':
            console.log(FgCyan, message);
            return;
        case 'PLEASANT':
            console.log(FgMagenta, message);
            return;
    }
}

/**
 * 
 * @param {string} userInfo 
 * @param {Function} callback 
 */
const generateToken = (userInfo, callback) => {
    JWT.sign(userInfo, process.env.API_KEY, { algorithm: 'HS512', expiresIn: 60 * 30 }, (err, token) => {
        if(err) {
            logToConsole('DANGER', 'Signing Error');
            console.log(err);
            return callback({ status: false, err });
        }
        return callback({ status: true, token })
    });
}

const verifyToken = (req, res, next) => {
    JWT.verify(req.headers.authorization?.split(' ')[1], process.env.API_KEY, (err, data) => {
        if(err) {
            logToConsole('DANGER', 'Verification Error');
            console.log(err);
            return res.status(401).json({ status: 0, msg: "Unauthorized: " + err.message, err });
        }
        req.user = data;
        return next();
    });
}

const checkToken = (req, res, next) => {
    if(!req.headers.authorization) {
        return next();
    }
    JWT.verify(req.headers.authorization?.split(' ')[1], process.env.API_KEY, (err, data) => {
        if(err) {
            logToConsole('DANGER', 'Verification Error');
            console.log(err);
            return res.status(401).json({ status: 0, msg: "Unauthorized: " + err.message, err });
        }
        req.user = data;
        return next();
    });
}

module.exports = {
    getNewMeetingId,
    getNewRoomId,
    getNewUserId,
    getNewKey,
    handleError,
    handle200Error,
    handle400Error,
    handle401Error,
    getPersonalRoomId,
    logToConsole,
    generateToken,
    verifyToken,
    checkToken
}