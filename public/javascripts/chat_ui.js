
$(document).ready(function () {
  var socket = io();
  var chat = new Chat(socket);

  // display msgs from server.
  socket.on('message', function (data) {

    var $li = $('<li>');

    if (data.bold) {
      $li.html('<b>' + _.escape(data.message) + '</b>');
    } else {
      $li.html(_.escape(data.message));
    }

    $('#chat').find('ul').append($li);
  });

  // handle nick change response
  socket.on('nicknameChangeResult', function (data) {
    if (data.success) {
      $('.nick').html(_.escape(data.message));
    } else {
      var $li = $('<li>');
      $li.html('<b>' + _.escape(data.message) + '</b>');
      $('#chat').find('ul').append($li);
    }
  });

  // handle user input
  $('#sendmsg').on('submit', function (event) {
    event.preventDefault();

    var $inputEl = $(this).find('input');

    var input = $inputEl.val();

    if (input[0] === "/") {
      try {
        chat.processCommand(input);
      } catch (err) {
        if (typeof err === "string") {
          var $li = $('<li>');
          $li.html('<b>' + err + '</b>');
          $('#chat').find('ul').append($li);
        } else {
          throw err;
        }
      }
    } else {
      chat.sendMessage(input);
    }

    $inputEl.val("");
  });

});
