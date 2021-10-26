const uniqid = require('uniqid');

const getNewMeetingId = () => {
    return uniqid();
}

const getNewRoomId = (userName) => {
    return uniqid(userName);
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

module.exports = {
    getNewMeetingId,
    getNewRoomId,
    getNewUserId,
    getNewKey,
    handleError,
    handle200Error,
    getPersonalRoomId,
    logToConsole
}