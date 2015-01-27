$(document).ready(function () {
  var socket = io();
  new ChatUI(socket);
});
