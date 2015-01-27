function ChatConnection(server, socket, guestNum) {
  this.server = server;
  this.socket = socket;
  this.guestNum = guestNum;
  this.myRooms = [];

  console.log("new connection. gnum: " + guestNum + " sockId: " + socket.id);

  this.welcomeGuest();

  this.socket.on("message", this.handleMessage.bind(this));
  this.socket.on("nicknameChangeRequest", this.handleNickChange.bind(this));
  this.socket.on("joinRoomRequest", this.handleJoinRoom.bind(this));
  this.socket.on("leaveRoomRequest", this.handleLeaveRoom.bind(this));
  this.socket.on("disconnect", this.handleDisconnect.bind(this));
}

ChatConnection.prototype.welcomeGuest = function () {
  console.log("welcoming..");

  // set up guest nick
  this.nick = "guest_" + this.guestNum;
  this.server.setNick(this.socket.id, this.nick);
  this.socket.emit("nicknameChangeResult", {
    success: true,
    message: this.nick
  });

  console.log("assigned nick: " + this.nick);

  // join lobby
  this.handleJoinRoom("lobby");

  // announce connection to lobby
  this.server.io.to("lobby").emit("message", {
    room: "lobby",
    message: this.nick + " has connected.",
    bold: true
  });
};

ChatConnection.prototype.handleMessage = function (data) {
  var time = new Date(Date.now()).toTimeString().slice(0,8);
  var msg = "[" + time + "]";
  msg += this.nick;
  msg += ": " + data.message;

  this.server.io.to(data.room).emit("message", {
    room: data.room,
    message: msg,
    bold: false
  });
};

ChatConnection.prototype.handleNickChange = function (newNick) {
  if (newNick.match(/^guest_/)) {
    this.socket.emit("nicknameChangeResult", {
      success: false,
      message: "Illegal nickname!"
    });
    return;
  }

  if (this.server.isTakenNick(newNick)) {
    this.socket.emit("nicknameChangeResult", {
      success: false,
      message: newNick + " is already taken!"
    });
    return;
  }

  var msg = this.nick + " is now known as " + newNick;

  this.socket.emit("nicknameChangeResult", {
    success: true,
    message: newNick
  });

  var that = this;
  this.myRooms.forEach(function (room) {
    that.server.io.to(room).emit("message", {
      room: room,
      message: msg,
      bold: true
    });
    that.server.io.to(room).emit("roomNick", {
      room: room,
      oldNick: that.nick,
      newNick: newNick
    });
  });

  this.nick = newNick;
  this.server.setNick(this.socket.id, newNick);
};

ChatConnection.prototype.handleJoinRoom = function (room) {
  console.log("joining room = " + room);
  this.server.joinRoom(this.socket, room);
  this.myRooms.push(room);
  this.socket.emit("joinRoomResult", {
    room: room,
    nicks: this.server.roomNicks(room)
  });
};

ChatConnection.prototype.handleLeaveRoom = function (room) {
  console.log("LeaveRoomRequest: " + this.nick + " is leaving " + room);

  var idx = this.myRooms.indexOf(room);

  if (idx === -1) return;

  this.server.leaveRoom(this.socket, room);
  this.myRooms.splice(idx, 1);
};

ChatConnection.prototype.handleDisconnect = function () {
  var that = this;

  console.log(this.nick + " is disconnecting.");

  this.myRooms.forEach(function (room) {
    that.server.leaveRoom(that.socket, room);
    that.server.io.to(room).emit("message", {
      room: room,
      message: that.nick + " has disconnected.",
      bold: true
    });
  });

  this.server.deleteNick(this.socket.id);
};


module.exports = ChatConnection;
