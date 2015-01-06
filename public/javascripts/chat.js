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
      console.log('invalid nick');
      throw "Invalid Nickname!";
    }
  } else {
    console.log('invalid command');
    throw "Invalid command!";
  }
};
