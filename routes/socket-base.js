
var communications = require('../routes/communications'), access = require('../routes/auth');

// When the user disconnects.. perform this
function onDisconnect (socket)
{
}

// When the user connects.. perform this
function onConnect (socket)
{

  // When the client emits 'ping', this listens and executes
  socket.on('ping', function (data)
  {
    console.info('ping [%s] %s', socket.address, JSON.stringify(data, null, 2));
    socket.emit('pong', 'This is coming from the Socket.io Server - ' + new Date());
  });

}

module.exports = function (io)
{
  'use strict';
  io.on('connection', function (socket)
  {
    communications.setIo(socket);
    access.setAuthIo(socket);

    socket.emit("Socket-Id", socket.id);
    // Call onDisconnect.
    socket.on('disconnect', function ()
    {
      //io.sockets.sockets.forEach(function(s, i)
      //{
      //  if(s.iiq === socket.iiq)
      //  {
      //    io.sockets.sockets.splice(i, 1);
      //  }
      //});
    });

    socket.on('refreshProfile', function (userId)
    {
       access.getProfileInfo(userId);
    });

    socket.on('clear-calls', function (userId)
    {
      communications.clearCalls(userId);
    });

    socket.on('remove-call', function (payload)
    {
      communications.deleteCall(userId, payload);
    });

    socket.on('loggedOut', function (socketId)
    {
      io.sockets.sockets.forEach(function(s, i)
      {
        if(s.iiq === userId)
        {
           io.sockets.sockets.splice(i, 1);
        }
      });

    });

  });

};

exports.ioSocket = function()
{
  if(sio)
  {
    return sio;
  }
  else{
    console.log('Socket not initialised!');
  }
}

//var userData =
//{
//  wallet : feedback.wallet,
//  iiq : feedback.iiq,
//  id : feedback.id,
//  isNew : false,
//  val_code : '',
//  phoneVerifiedNow : true
//}
//
//if()
//  sio.handshake.session.userdata = userData;


