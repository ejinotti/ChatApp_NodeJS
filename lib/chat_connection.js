function ChatConnection(server, socket, guestNum) {
  this.server = server;
  this.socket = socket;
  this.guestNum = guestNum;

  this.welcomeGuest();

  this.socket.on('message', this.handleMessage.bind(this));
  this.socket.on('nicknameChangeRequest', this.handleNickChange.bind(this));
  this.socket.on('disconnect', this.handleDisconnect.bind(this));
}

ChatConnection.prototype.welcomeGuest = function () {
  this.nick = 'guest_' + (++this.guestNum);
  this.server.setNick(this.socket.id, this.nick);
  this.socket.emit('nicknameChangeResult', {
    success: true,
    message: this.nick
  });
  this.server.emit('message', {
    message: this.nick + ' has connected.',
    bold: true
  });
};

ChatConnection.prototype.handleMessage = function (message) {
  var time = new Date(Date.now()).toTimeString().slice(0,8);
  var msg = '[' + time + ']';
  msg += this.nick;
  msg += ': ' + message;

  this.server.emit('message', {
    message: msg,
    bold: false
  });
};

ChatConnection.prototype.handleNickChange = function (nick) {
  if (nick.match(/^guest_/)) {
    this.socket.emit('nicknameChangeResult', {
      success: false,
      message: 'Illegal nickname!'
    });
    return;
  }

  if (this.server.isTakenNick(nick)) {
    this.socket.emit('nicknameChangeResult', {
      success: false,
      message: nick + ' is already taken!'
    });
    return;
  }

  var msg = this.nick + ' is now known as ' + nick;

  this.socket.emit('nicknameChangeResult', {
    success: true,
    message: nick
  });

  this.server.emit('message', { message: msg, bold: true });
  this.nick = nick;
  this.server.setNick(this.socket.id, nick);
};

ChatConnection.prototype.handleDisconnect = function () {
  this.server.emit('message', {
    message: this.nick + ' has disconnected.',
    bold: true
  });
  this.server.deleteNick(this.socket.id);
};


module.exports = ChatConnection;
