const router = require('express').Router();
const sha1 = require('sha1');
const User = require('../models/user');
const Room = require('../models/room');
const { getNewMeetingId, getNewRoomId, getNewUserId, getNewKey, handle200Error, handleError, getPersonalRoomId, logToConsole, verifyToken, checkToken, handle400Error } = require('../utils/utils')

router.post('/createRoom', verifyToken, (req, res) => {
	const roomId = getNewRoomId(req.user.email);
	const host = {
		'hostName': req.user.name,
		'hostId': getNewUserId()
	}
	new Room({
		'meetingId': getNewMeetingId(),
		'roomId': roomId,
		'host': host,
		'guests': [{ 'guestId': host.hostId, 'guestName': host.hostName, 'isHost': true }],
		'roomKey': getNewKey(),
	}).save().then(newRoom => {
		const nsp = io
			.of('/' + roomId)
			.use((socket, next) => {
				let roomId1 = socket.handshake.query.roomId || null;
				let userId1 = socket.handshake.query.userId || null;
				logToConsole('PLEASANT', `User Object in Socket Handshake: userid=${userId1}, roomid=${roomId1}`);
				console.log(socket.handshake.query);
				if (userId1) {
					authUser(userId1, roomId1).then(authRes => {
						socket._isAuthenticated = true;
						socket._authError = null;
						socket._guestId = userId1,
							socket._isHost = authRes.isHost,
							socket._name = authRes.guestName,
							socket._roomId = roomId1;
						console.log("Use If Then me ", socket._isAuthenticated, socket._isHost, socket._authError);
						return next();
					}).catch(x => {
						socket._isAuthenticated = false;
						socket._authError = x;
						console.log("Use If Catch me ", socket._isAuthenticated, socket._authError);
						return next();
					})
				} else {
					socket._isAuthenticated = false;
					socket._authError = "User obj required";
					console.log("Use Else me ", socket._isAuthenticated, socket._authError);
					return next();
				}
			});
		nsp.on('connection', socket => {
			logToConsole('WARNING', `Someone trying to connect... [User ID = ${socket._guestId}, Room ID = ${socket._roomId}]`);
			if (!socket._isAuthenticated) {
				socket.emit("authenticate", { status: false, msg: socket._authError });
				logToConsole('DANGER', 'Someone Tried to Connect but Authentication Failed :(');
				socket.disconnect(true);
			} else {
				Room.getGuests(socket._roomId).then(resp => {
					const previouslyLeftUser = resp.data.find(r => r.guestId == socket._guestId);
					let rejoinTask = new Promise((resolve, reject) => {
						if (previouslyLeftUser) {
							logToConsole('WARNING', `Someone trying to re-join... [User ID = ${socket._guestId}], Guest ID = ${socket._guestId}]`);
							Room.joinRoom(resp.meetingId, previouslyLeftUser).then(result => {
								logToConsole('SUCCESS', `Someone Re-joined Successfully... [User ID = ${socket._guestId}, Guest ID = ${socket._guestId}]`);
								resolve();
							}).catch(err => {
								console.log(err);
								logToConsole("DANGER", `Someone Failed to re-join... [User ID = ${socket._guestId}, Guest ID = ${socket._guestId}]`);
								reject();
							});
						} else {
							resolve();
							logToConsole('PLEASANT', 'Someone joining for 1st time');
						}
					});
					rejoinTask.then(() => {
						if (resp.status) {
							Room.getGuests(socket._roomId, true).then(resp2 => {
								joinPersonalRooms(socket._guestId, resp2.data, socket);
								socket.emit("authenticate", { status: true, msg: "Successfuly authenticated, Sending user list", guests: resp2.data });
							}).catch(err => {
								socket.emit("authenticate", { status: true, msg: "Successfuly authenticated, Sending user list" + err, guests: [] });
							})
						} else {
							socket.emit("authenticate", { status: true, msg: "Successfuly authenticated, Sending user list" + resp.msg, guests: [] });
						}
					}).catch(err => {
						socket.emit("authenticate", { status: true, msg: "Successfuly authenticated, Sending user list" + err, guests: [] });
					});
				}).catch(err => {
					socket.emit("authenticate", { status: true, msg: "Successfuly authenticated, Sending user list" + err, guests: [] });
				})
				if (socket._isHost) { //listeners for host
					socket.on('guest-request-response', (response) => {   //{status:true/false,guestObj:{guestId,guestName},meetingId:""}
						if (response.status) {
							Room.joinRoom(response.meetingId, response.guestObj)
								.then(x => {
									console.log("guest-request-response:  ", x);
								})
								.catch(e => {
									console.log("guest-request-response:  ", e);
								})
						}
					})
				}
				socket.on('join-personal-room', (response) => {
					let { ownId, userId } = response;
					let personalRoomId = getPersonalRoomId(ownId, userId);
					logToConsole('INFO', `NEW PERSONAL ROOM = ${personalRoomId}`);
					socket.join(personalRoomId);
				});
				socket.on('personal-message', (msgObj) => { //{type=0:"msg",type=1:"Action",type=3:"typing"}  {type,to,from,msg}
					let { to, from } = msgObj;
					let personalRoomId = getPersonalRoomId(to, from);
					logToConsole('SUCCESS', "PERSONAL MESSAGE:");
					console.log(msgObj);
					console.log(personalRoomId);
					socket.broadcast.to(personalRoomId).emit('personal-message-reply', msgObj);
				})
				socket.on("group-message", (msgObj) => { //{type=0:"msg",type=1:"Action",type=3:"typing"}  {type,from,msg}
					logToConsole('SUCCESS', "GROUP MESSAGE:");
					console.log(msgObj);
					nsp.emit('group-message-reply', msgObj);
				})
				socket.on('disconnect', () => {
					logToConsole('WARNING', `Someone trying to disconnect... [User ID = ${socket._guestId}, Guest ID = ${socket._guestId}]`);
					Room.leaveRoom(socket._roomId, socket._guestId).then(result => {
						logToConsole('SUCCESS', `Someone Disconnected Successfully... [User ID = ${socket._guestId}, Guest ID = ${socket._guestId}]`);
						nsp.emit('user-left', {
							'userId': socket._guestId
						});
					}).catch(err => {
						console.log(err);
						logToConsole("DANGER", `Someone Failed to disconnect... [User ID = ${socket._guestId}, Guest ID = ${socket._guestId}]`);
					});
				});
				nsp.emit('new-user-added', {
					'userId': socket._guestId,
					'name': socket._name,
					'isHost': socket._isHost,
				});
				logToConsole('SUCCESS', `Someone Connected Successfully... [User ID = ${socket._guestId}, Guest ID = ${socket._guestId}]`);
			}
		});
		res.status(200).json({
			'status': 1,
			'data': {
				'roomId': roomId,
				'roomKey': newRoom.roomKey,
				'host': host,
				'meetingId': newRoom.meetingId
			}
		})
	}).catch(e => {
		handleError(res);
	})
});

router.post('/joinRoom', checkToken, (req, res) => {
	if(!req.body.meetingId) {
		return handle400Error(res, "Meeting ID missing");
	}
	if(!req.body.username && !req.user) {
		return handle400Error(res, "Username / Email is missing");
	}
	var meetingId = req.body.meetingId;
	var guestName = req.user ? req.user.name : req.body.username;
	var roomKey = req.body.roomKey || null;
	Room.getRoomId(meetingId).then((result) => {
		if (result.status) {
			var roomId = result.data.roomId;
			var guestObj = {
				'guestId': getNewUserId(),
				'guestName': guestName
			}
			if (roomKey) {
				if (roomKey == result.data.roomKey) {
					Room.joinRoom(meetingId, guestObj)
						.then(result1 => {
							if (result1.status) {
								return res.status(200).json({
									'status': 1,
									'data': {
										'guestObj': guestObj,
										'roomId': roomId
									}
								});
							} else {
								return handle200Error(res, result1.msg);
							}
						})
						.catch(e => {
							return handleError(res);
						})
				} else {
					return handle200Error(res, "Invalid Room Key");
				}
			} else {
				try {
					const nsp = io.of('/' + roomId);
					logToConsole('INFO', 'NSP Sockets start >>>>');
					var nspSockets = [...nsp.sockets.keys()];
					console.log(nspSockets);
					// console.warn("NSG 0",nsp.connected[Object.keys(nsp.connected)[0]]);//.sockets.sockets);
					// console.warn("KEYS 0",Object.keys(nsp.connected[Object.keys(nsp.connected)[0]]));//.sockets.sockets));
					var hostSocket = nspSockets.find(x => {
						return nsp.sockets.get(x)._isHost == true;
					});
					console.log(hostSocket);
					hostSocket = nsp.sockets.get(hostSocket);
					hostSocket.emit('guest-request', guestObj);
					logToConsole('INFO', 'NSP Sockets end >>>>');
				} catch (err) {
					logToConsole("DANGER", `Failed to send Notification to Host`);
					console.log(err);
					return handleError(res);
				}
				return res.status(200).json({
					'status': 0,
					'data': {
						'guestObj': guestObj,
						'meetingId': meetingId
					}
				});
			}
		} else {
			return handle200Error(res, result.msg);
		}
	}).catch(e => {
		console.log(e)
		return handleError(res);
	});
});

router.get('/checkReqStatus', (req, res) => {
	if(!req.query.meetingId) {
		return handle400Error(res, "Meeting ID missing");
	}
	var guestId = req.query.guestId || null;
	var meetingId = req.query.meetingId;
	if (guestId && meetingId) {
		Room.findOne({ 'meetingId': meetingId }, (err, room) => {
			if (err) return handleError(res);
			if (!room) return handle200Error(res, "Invalid Meeting ID!");
			var guest = room.guests.find(x => {
				return x.guestId == guestId;
			});
			if (guest) {
				return res.status(200).json({
					'status': 1,
					'guestObj': { 'guestId': guest.guestId, 'guestName': guest.guestName },
					'roomId': room.roomId
				})
			} else {
				return handle200Error(res, "Not Accepted");
			}
		})
	} else {
		return res.status(500).json({
			'err': "Error in query params"
		});
	}
})

router.get('/getUserInfo', (req, res) => {
	if(!req.query.meetingId) {
		return handle400Error(res, "Meeting ID missing");
	}
	var meetingId = req.query.meetingId
	var userId = req.query.userId || null;
	if (meetingId) {
		Room.findOne({ 'meetingId': meetingId }, (err, room) => {
			if (err) return handleError(res);
			if (!room) return handle200Error(res, "Invalid Meeting ID!");
			var guest = room.guests.find(x => {
				return x.guestId == userId;
			});
			return res.status(200).json({
				'status': 1,
				'userInfo': {
					userId: guest?.guestId,
					isHost: room.host.hostId == userId,
					username: guest?.guestName,
					roomId: room.roomId,
					roomKey: room.host.hostId == userId ? room.roomKey : undefined
				}
			});
		})
	} else {
		return res.status(500).json({
			'err': "Error in query params"
		});
	}
})

const joinPersonalRooms = (ownId, guests, socket) => {
	guests.forEach(guest => {
		let userId = guest.guestId;
		if (userId != ownId) {
			let roomId = getPersonalRoomId(ownId, userId);
			logToConsole('INFO', `${ownId} and ${userId} joining to ${roomId}`);
			socket.join(roomId);
		}
	});
}

const authUser = (userId, roomId) => {
	return new Promise((resolve, reject) => {
		if (!roomId) return reject("Room id required");
		Room.findOne({ 'roomId': roomId }, (err, room) => {
			if (err) return reject("internal server error");
			if (!room) return reject("Room not found");
			let user = room.guests.find(x => {
				return x.guestId == userId;
			});
			if (!user) return reject("Auth Failed");
			if (user.isHost) {
				return resolve({ 'userObj': user, 'isHost': true, 'guestName': user.guestName });
			} else {
				return resolve({ 'userObj': user, 'isHost': false, 'guestName': user.guestName });
			}
		});
	})
}

module.exports = router;