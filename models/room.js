const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const roomSchema = new Schema({
    meetingId: {
        type: String,
        unique: true
    },
    roomId: {
        type: String,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    host: {
        hostId: String,
        hostName: String
    },
    roomKey: {
        type: String
    },
    guests: [{
        guestId: {
            type: String
        },
        guestName: {
            type: String
        },
        status: {
            type: Boolean,
            default: true
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        leftAt: {
            type: Date,
            default: null
        },
        isHost: {
            type: Boolean,
            default: false
        }
    }]
});

roomSchema.statics.joinRoom = (meetingId, guestObj) => {  //guestObj = {'guestId','guestName'}
    var promise = new Promise((resolve, reject) => {
        Room.findOne({ 'meetingId': meetingId }, (err, room) => {
            if (err) return reject(err);
            if (!room) return resolve({ status: false, msg: "Invalid Meeting ID!" });
            let guest = room.guests.find(x => {
                return x.guestId == guestObj.guestId;
            });
            let msg = "";
            if (guest) {
                if (guest.status) {
                    msg = "Guest already joined";
                } else {
                    let oldGuests = room.guests.filter(x => {
                        return x.guestId != guestObj.guestId;
                    });
                    guest.status = true;
                    guest.leftAt = null;
                    guest.joinedAt = Date.now();
                    oldGuests.push(guest);
                    room.guests = oldGuests;
                    msg = "Guest already in the meeting, status updated";
                }
            } else {
                room.guests.push(guestObj);
                msg = "Guest added";
            }
            room.save().then(newRomm => {
                return resolve({ status: true, data: newRomm, msg });
            }).catch(e => {
                return reject(e);
            })
        });
    });
    return promise;
}

roomSchema.statics.leaveRoom = (roomId, guestId) => {
    var promise = new Promise((resolve, reject) => {
        Room.findOne({ 'roomId': roomId }, (err, room) => {
            if (err) return reject(err);
            if (!room) return resolve({ status: false, msg: "Invalid Meeting ID!" });
            let guest = room.guests.find(x => {
                return x.guestId == guestId;
            });
            let msg = "";
            if (guest) {
                let oldGuests = room.guests.filter(x => {
                    return x.guestId != guestId;
                });
                guest.status = false;
                guest.leftAt = Date.now();
                oldGuests.push(guest);
                room.guests = oldGuests;
                msg = "Guest leaved";
                room.save().then(newRoom => {
                    return resolve({ status: true, msg: msg });
                }).catch(e => {
                    return reject({ status: false, msg: "Guest Leave Error" });
                })
            } else {
                return resolve({ status: false, msg: "Guest was not in this room" });
            }
        });
    });
    return promise;
}

roomSchema.statics.verifyKey = (meetingId, roomKey) => {
    var promise = new Promise((resolve, reject) => {
        Room.findOne({ 'meetingId': meetingId }, (err, room) => {
            if (err) return reject(err);
            if (!room) return resolve({ status: false, msg: "Invalid Meeting Id!" });
            if (roomKey == room.roomKey) {
                return resolve({ status: true, msg: "Successfully Authenticated", data: room.roomId });
            } else {
                return resolve({ status: false, msg: "Invalid Room Key" })
            }
        });
    });
    return promise;
}

roomSchema.statics.getGuests = (roomId, status = "ANY") => {
    var promise = new Promise((resolve, reject) => {
        Room.findOne({ 'roomId': roomId }, (err, room) => {
            if (err) return reject(err);
            if (!room) return resolve({ status: false, msg: "Invalid Meeting Id!" });
            if (status == "ANY") {
                return resolve({ status: true, msg: "Guests found", meetingId: room.meetingId, data: room.guests });
            } else {
                var filteredGuest = room.guests.filter(x => {
                    return x.status == status;
                });
                return resolve({ status: true, msg: "Guests found(filtered)", meetingId: room.meetingId, data: filteredGuest })
            }
        });
    });
    return promise;
}

roomSchema.statics.getRoomId = (meetingId) => {
    var promise = new Promise((resolve, reject) => {
        Room.findOne({ 'meetingId': meetingId }, (err, room) => {
            if (err) return reject(err);
            if (!room) return resolve({ status: false, msg: "Invalid Meeting Id!" });

            return resolve({ status: true, msg: "Room Id found", data: { roomId: room.roomId, roomKey: room.roomKey } });
        });
    });
    return promise;
}

const Room = module.exports = mongoose.model('Room', roomSchema);