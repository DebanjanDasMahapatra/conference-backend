var uniqid = require('uniqid');
const getNewId = (userName = "") => {
    return uniqid.process(userName);
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
module.exports = {
    getNewId,
    getNewKey,
    handleError,
    handle200Error,
    getPersonalRoomId
}