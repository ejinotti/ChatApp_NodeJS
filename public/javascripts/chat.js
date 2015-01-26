function Chat (socket) {
  this.socket = socket;
}

Chat.prototype.sendMessage = function (msg) {
  this.socket.emit('message', msg);
};

Chat.prototype.processCommand = function (cmd) {
  var matchData = [];

  if ((matchData = cmd.match(/^\/nick\s+(.*)/))) {
    var nick = matchData[1];

    if (nick.match(/^[\w|\d]+$/)) {
      this.socket.emit('nicknameChangeRequest', nick);
    } else {
      throw "Invalid Nickname!";
    }
  } else if ((matchData = cmd.match(/^\/join\s+(.*)/))) {
    var room = matchData[1];

    if (room.match(/^[\w|\d]+$/)) {
      this.socket.emit('joinRoomRequest', room);
    } else {
      throw "Invalid Room!";
    }
  } else if (cmd.match(/^\/leave\s+/)) {
    this.socket.emit("leaveRoomRequest");
  } else {
    throw "Invalid Command!";
  }
};
