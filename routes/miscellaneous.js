
var nodemailer = require('nodemailer'), PhoneNumber = require( 'awesome-phonenumber'), querystring = require('query-string'), Firebase = require('firebase'), firebaze = new Firebase('https://wiretooth.firebaseio.com/'), client = require('twilio/lib')('AC9b478e612b78783673f81208722edfd3', '1358efbbe723fefa9f818c6d26e4ddf2'), moment = require('moment');

var feedback ={code : -1, msg : 'Your request could not be completed at this time. Please try again later.'};

exports.contactUs = function (req, res, next)
{
  var email = req.query.email;
  var message = req.query.message;

  if(email == null || email == undefined || email.length < 1)
  {
    feedback.msg =  'Please provide your valid Email for feedback.';
    return res.send(feedback);
  }

  if(message == null || message == undefined || message.length < 1)
  {
    feedback.msg =  'Please provide a message.';
    return res.send(feedback);
  }

  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:
    {
      user: 'think.innovation9@gmail.com',
      pass: 'n9ufxplugv5'
    }
  });
  transporter.sendMail(
   {
     from: email,
    to: 'think.innovation9@gmail.com',
    subject: 'Customer Feedback',
    text: message
  }, function(error, info)
  {
    if(error)
    {
      console.log('Message Error : ' + JSON.stringify(error));
      return res.send(feedback);
    }
    //('Message sent: ' + info.response)
    console.log('Message Feedback : ' + JSON.stringify(info));
    feedback.msg =  'We have got your message. Be reset assured that we are already on it. Thanks for reaching back to us.';
    feedback.code = 5;
    return res.send(feedback);
  });

};


exports.inviteFriend = function (req, res, next)
{
  var email = req.query.email;

  if(email == null || email == undefined || email.length < 1)
  {
    feedback.msg =  'Please provide your valid Email for feedback.';
    return res.send(feedback);
  }

  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:
    {
      user: 'think.innovation9@gmail.com',
      pass: 'n9ufxplugv5'
    }
  });
  transporter.sendMail(
      {
        from: 'think.innovation9@gmail.com',
        to: email,
        subject: 'You will love this!',
        html: 'Hi.<br>There is this amazing app for calls and messaging with crazy features and even crazier tarrif rates.<br>Try <a href="http://6fc8c48e.ngrok.io/wiretooth.io/webclient/index.html#/calls">WireTooth!</a>',
      }, function(error, info)
      {
        if(error)
        {
          console.log('Message Error : ' + JSON.stringify(error));
          return res.send(feedback);
        }
        //('Message sent: ' + info.response)
        console.log('Message Feedback : ' + JSON.stringify(info));
        feedback.msg =  'Thanks for helping us have a wider reach. Your kind gesture is highly appreciated.';
        feedback.code = 5;
        return res.send(feedback);
      });

};