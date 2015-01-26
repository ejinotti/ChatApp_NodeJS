function ChatConnection(server, socket, guestNum) {
  this.server = server;
  this.socket = socket;
  this.guestNum = guestNum;

  this.welcomeGuest();

  this.socket.on("message", this.handleMessage.bind(this));
  this.socket.on("nicknameChangeRequest", this.handleNickChange.bind(this));
  this.socket.on("joinRoomRequest", this.handleJoinRoom.bind(this));
  this.socket.on("leaveRoomRequest", this.handleLeaveRoom.bind(this));
  this.socket.on("disconnect", this.handleDisconnect.bind(this));
}

ChatConnection.prototype.welcomeGuest = function () {

  // join lobby
  this.myRooms = ["lobby"];
  this.server.joinRoom(this.socket, "lobby");

  // set up guest nick
  this.nick = "guest_" + (++this.guestNum);
  this.server.setNick(this.socket.id, this.nick);
  this.socket.emit("nicknameChangeResult", {
    success: true,
    message: this.nick
  });

  // announce connection
  this.server.emitMsg(this.myRooms, {
    message: this.nick + " has connected.",
    bold: true
  });
};

ChatConnection.prototype.handleMessage = function (data) {
  var time = new Date(Date.now()).toTimeString().slice(0,8);
  var msg = "[" + time + "]";
  msg += this.nick;
  msg += ": " + data.message;

  this.server.emitMsg([data.room], {
    message: msg,
    bold: false
  });
};

ChatConnection.prototype.handleNickChange = function (nick) {
  if (nick.match(/^guest_/)) {
    this.socket.emit("nicknameChangeResult", {
      success: false,
      message: "Illegal nickname!"
    });
    return;
  }

  if (this.server.isTakenNick(nick)) {
    this.socket.emit("nicknameChangeResult", {
      success: false,
      message: nick + " is already taken!"
    });
    return;
  }

  var msg = this.nick + " is now known as " + nick;

  this.socket.emit("nicknameChangeResult", {
    success: true,
    message: nick
  });

  this.server.emitMsg(this.myRooms, { message: msg, bold: true });
  this.nick = nick;
  this.server.setNick(this.socket.id, nick);
};

ChatConnection.prototype.handleJoinRoom = function (room) {
  this.server.joinRoom(this.socket, room);
  this.socket.emit("joinRoomResult", {
    room: room,
    nicks: this.server.roomNicks(room)
  });
};

ChatConnection.prototype.handleLeaveRoom = function (room) {
  this.server.leaveRoom(this.socket, room);
};

ChatConnection.prototype.handleDisconnect = function () {
  var that = this;

  this.server.deleteNick(this.socket.id);

  this.myRooms.forEach(function (room) {
    that.server.leaveRoom(that.socket, room);
  });

  this.server.emitMsg(this.myRooms, {
    message: this.nick + " has disconnected.",
    bold: true
  });
};


module.exports = ChatConnection;
