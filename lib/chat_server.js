var ChatConnection = require('./chat_connection');

function ChatServer(server) {
  this.io = require('socket.io')(server);

  this.guestNum = 0;
  this.nicknames = {};

  var that = this;

  this.io.on('connection', function (socket) {
    new ChatConnection(that, socket, ++that.guestNum);
  });
}

ChatServer.prototype.emit = function (event, data) {
  this.io.emit(event, data);
};

ChatServer.prototype.setNick = function (id, nick) {
  this.nicknames[id] = nick;
};

ChatServer.prototype.getNick = function (id) {
  return this.nicknames[id];
};

ChatServer.prototype.deleteNick = function (id) {
  delete this.nicknames[id];
};

ChatServer.prototype.isTakenNick = function (nick) {
  for (var id in this.nicknames) {
    if (this.nicknames[id] === nick) {
      return true;
    }
  }
  return false;
};


module.exports = ChatServer;
