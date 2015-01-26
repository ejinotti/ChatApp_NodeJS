var ChatConnection = require('./chat_connection');

function ChatServer(server) {
  this.io = require('socket.io')(server);

  this.guestNum = 0;
  this.nicknames = {};
  this.allRooms = {};

  var that = this;

  this.io.on('connection', function (socket) {
    new ChatConnection(that, socket, ++that.guestNum);
  });
}

ChatServer.prototype.emitMsg = function (rooms, data) {
  rooms.forEach(function (room) {
    this.io.to(room).emit("message", data);
  });
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

ChatServer.prototype.joinRoom = function (socket, room) {
  if (!this.allRooms[room]) {
    this.allRooms[room] = [];
  }

  this.allRooms[room].push(socket.id);

  this.io.to(room).emit("roomJoin", {
    room: room,
    nick: this.nicknames[socket.id]
  });

  socket.join(room);
};

ChatServer.prototype.leaveRoom = function (socket, room) {
  var idx = this.allRooms[room].indexOf(socket.id);

  // TODO might want to do something else when not found..
  if (idx === -1) return;

  this.allRooms[room].splice(idx, 1);
  socket.leave(room);

  if (this.allRooms[room].length === 0) {
    delete this.allRooms[room];
  } else {
    this.io.to(room).emit("roomLeave", {
      room: room,
      nick: this.nicknames[socket.id]
    });
  }
};

ChatServer.prototype.roomNicks = function (room) {
  var names = [];

  this.allRooms[room].forEach(function (socketId) {
    names.push(this.nickNames(socketId));
  });

  return names;
};

module.exports = ChatServer;
