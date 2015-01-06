
function createChat(server) {
  var io = require('socket.io')(server);

  var guestNumber = 0;
  var nicknames = {};

  io.on('connection', function (socket) {

    // set initial guest nick
    var tempNick = 'guest_' + (++guestNumber);
    nicknames[socket.id] = tempNick;
    socket.emit('nicknameChangeResult', {
      success: true,
      message: tempNick
    });
    io.emit('message', {
      message: tempNick + ' has connected.',
      bold: true
    });

    // echo messages
    socket.on('message', function (message) {
      io.emit('message', {
        message: message,
        bold: false
      });
    });

    // handle nick chage requests
    socket.on('nicknameChangeRequest', function (nick) {
      if (nick.match(/^guest_/)) {
        socket.emit('nicknameChangeResult', {
          success: false,
          message: 'Illegal nickname!'
        });
        return;
      }

      for (var id in nicknames) {
        if (nicknames[id] === nick) {
          socket.emit('nicknameChangeResult', {
            success: false,
            message: nick + ' is already taken!'
          });
          return;
        }
      }

      var msg = nicknames[socket.id] + ' is now known as ' + nick;

      socket.emit('nicknameChangeResult', {
        success: true,
        message: nick
      });

      io.emit('message', { message: msg, bold: true });
      nicknames[socket.id] = nick;
    });

    // free nick on disconnect
    socket.on('disconnect', function () {
      io.emit('message', {
        message: nicknames[socket.id] + ' has disconnected.',
        bold: true
      });
      delete nicknames[socket.id];
    });
  });
}

exports.createChat = createChat;
