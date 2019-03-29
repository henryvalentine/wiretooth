
var FireBase = require('firebase'), nairaEquivalent = 268, destination = require('destinationInfo'), PhoneNumber = require( 'awesome-phonenumber'), moment = require('moment'), querystring = require('query-string'),
calling = require('calling'), twilio = require('twilio'), walletInfo = require('wallet'), tw_messaging = require('twillio_comms'),  Firebase = require('firebase'), firebaze = new Firebase('https://wiretooth.firebaseio.com/'), client = require('twilio/lib')('AC9b478e612b78783673f81208722edfd3', '1358efbbe723fefa9f818c6d26e4ddf2')
utilities = require('utilities'),util = require('util'), PricingClient = require('twilio').PricingClient, priceApi = new PricingClient('AC9b478e612b78783673f81208722edfd3', '1358efbbe723fefa9f818c6d26e4ddf2');
var sio = '';
var smsErrors =
    [
        {30001 : 'Queue overflow'},
        {30002 : 'Account suspended'},
        {30003 : 'Unreachable destination handset'},
        {30004 : 'Message blocked'},
        {30005 : 'Land line or unreachable carrier'},
        {30007 : 'Carrier violation'},
        {30008 : 'Unknown error'},
        {30009 : 'Missing segment'},
        {30010 : 'Message price exceeds max price'}
    ];

exports.normalize = function (req, res, next) {
        //console.log('Params : ' + JSON.stringify(req.params));
        //console.log('Query : ' + JSON.stringify(req.query));
        //console.log('Body : ' + JSON.stringify(req.body));

        var number = req.query.number;
        var destinationCode = req.query.code;
        var userId = req.query.userId;
        var gt = req.query.gt;
        var nmb = req.query.phoneNumber;

        var callInfo = {
            'number': '',
            'isValid': false,
            'type': 'Unknown',
            'rate_min_NGN': '0.00',
            'rate_min_USD': '0.00',
            'csT': 0,
            '_token': '',
            'res_code': -1,
            'msg': 'The Phone number could not be recognized'
        };
        if (number == null || number == undefined || number.length < 1) //number == null || number == undefined || number.length < 1 || userId == null || userId.length < 1
        {
            res.send(callInfo);
        }
        else {
            var pn = new PhoneNumber(number, destinationCode);
            var isValid = pn.isValid();
            if (isValid === false) {
                res.send(callInfo);
            }
            else {
                var normalizedNumber = pn.getNumber();
                var numberType = pn.getType().replace('-line', '');

                //priceApi.voice.numbers(number).get(function (err, number)
                //{
                //    if (err) {
                //        console.log('Price check error : ' + JSON.stringify(err))
                //        return res.send(callInfo);
                //    }

                    if (gt)
                    {
                        if (nmb !== undefined && nmb !== null && nmb.length > 0)
                        {
                            callInfo._token = calling.getToken2(nmb);
                        }
                    }
                    //console.log('Price check result : ' + JSON.stringify(number));
                    callInfo.rate_min_NGN = 4.5  //parseFloat(number.outboundCallPrice.currentPrice) * nairaEquivalent;
                    callInfo.rate_min_USD =  0.00025  //number.outboundCallPrice.currentPrice;
                    callInfo.number = normalizedNumber;
                    callInfo.isValid = isValid;
                    callInfo.type = numberType;
                    callInfo.res_code = 5;
                    callInfo.msg = 'Success!';
                    res.send(callInfo);

                //});

            }

        }
    };

var g_res = '';
var smsInfo = {
        'number': '',
        'res_code': -1,
        'msg': '',
        invalidNumbers: [],
        unsentMessages: [],
        sentMessages: [],
        balance: 0
    };

exports.sendSms = function (req, res, next) {
        var from = req.query.from;
        var numbers = req.query.to;
        var message = req.query.body;
        var destinationCode = req.query.code;
        var userId = req.query.userId;

        console.log('Request numbers: ' + JSON.stringify(numbers))

        var calculatedPages = Math.ceil(message.length / 160);

        if (message == null || message == undefined || message.length < 1) {
            smsInfo.msg = 'Please provide a message to be delivered to the recipient';
            res.send(smsInfo);
        }

        if (!numbers || numbers.length < 1) {
            smsInfo.msg = 'Recipient could not be recognized';
            res.send(smsInfo);
        }

        if (!userId || userId.length < 1) {
            smsInfo.msg = 'Please be sure to log in before proceeding.';
            res.send(smsInfo);
        }

        var normalisedNumbers = [];
        var invalidNumbers = [];
        var test = JSON.stringify(numbers);
        if (test.indexOf('[') >= 0) {
            console.log('Array of destinations');
            numbers.forEach(function (c, i) {
                var parsedNumber = JSON.parse(c);
                var pn = new PhoneNumber(parsedNumber.number, parsedNumber.destinationCode);
                var isValid = pn.isValid();
                if (isValid === false) {
                    invalidNumbers.push(c);
                }
                else {
                    var validNumber = pn.getNumber();
                    normalisedNumbers.push({number: validNumber, code: parsedNumber.iso});

                }
            });
        }
        else {
            var parsedNumber = JSON.parse(numbers);
            console.log('number : ' + parsedNumber);
            console.log('dial code: ' + parsedNumber.destinationCode)
            var pn = new PhoneNumber(parsedNumber.number, parsedNumber.destinationCode);
            var isValid = pn.isValid();
            if (isValid === false) {
                invalidNumbers.push(c);
            }
            else {
                var validNumber = pn.getNumber();
                normalisedNumbers.push({number: validNumber, code: parsedNumber.iso});

            }
        }

        if (normalisedNumbers.length < 1) {
            smsInfo.msg = 'Please provide valid recipients.';
            res.send(smsInfo);
        }

        var unsentMessages = [];
        var sentMessages = [];
        var wallets = new Firebase("https://wiretooth.firebaseio.com/wallets").orderByChild("phone").equalTo(from);
        wallets.once("value", function (walletSnapshot) {
            if (walletSnapshot.val() !== null) {
                var wallSnap = walletSnapshot.val();
                var walletKey = Object.keys(wallSnap)[0];
                var balance = wallSnap[walletKey].balance;
                if (balance == null || balance < 1) {
                    smsInfo.msg = 'You do not have sufficient balance to send this message.';
                    res.send(smsInfo);
                }
                else {
                    normalisedNumbers.forEach(function (c, i) {
                        var price = utilities.getPrice(c.code);

                        if (price === undefined || price.countryCode.length < 1) {
                            unsentMessages.push({number: c, msg: 'Request failed'})
                        }
                        else {
                            var smsPrice = price.nairaRate * calculatedPages;

                            if (balance >= smsPrice) {
                                sinchSms.send(c.number, from, message).then(function (response) {
                                    console.log('Message success : ' + JSON.stringify(response));

                                    console.log('Sent message response' + JSON.stringify(responseData));
                                    if (response.sid == null || response.sid.length < 1) {
                                        unsentMessages.push({number: c.number, msg: 'Request failed'});
                                    }
                                    else {
                                        var response = responseData.body;
                                        var smsInitiatedAt = moment().format('MM/DD/YYYY hh:mm:ss A');
                                        var text = {
                                            'userId': userId,
                                            'to': c.number,
                                            'timeSent': smsInitiatedAt,
                                            timeDelivered: '',
                                            body: message,
                                            status: response.status,
                                            id: response.MessageSid
                                        };

                                        var sms_collection = firebaze.child("sms");
                                        var sms_status = sms_collection.push(text);
                                        sentMessages.push({numbe: c.number, msg: 'message has been sent'})

                                        //deduct sms price from balance
                                        balance = balance - smsPrice;

                                        //update wallet
                                        var walletRef = new Firebase("https://wiretooth.firebaseio.com/wallets/" + walletKey);
                                        walletRef.update({balance: balance});
                                    }
                                }).fail(function (error) {
                                    console.log('Message sending error : ' + error);
                                    unsentMessages.push({number: c, msg: 'Request failed'});
                                });
                            }
                            else {
                                unsentMessages.push({number: c, msg: 'Insufficient balance.'});
                            }
                        }
                    });
                    if (sentMessages.length > 0) {
                        smsInfo.balance = balance;
                        smsInfo.res_code = 5;
                        smsInfo.sentMessages = sentMessages;
                    }
                    smsInfo.invalidNumbers = invalidNumbers;
                    smsInfo.unsentMessages = unsentMessages;
                    smsInfo.msg = 'Please review your request response.';
                    res.send(smsInfo);
                }

            }
            else {
                smsInfo.msg = 'Request failed. Please try again later.';
                res.send(smsInfo);
            }
        });
    };

function logCall(call) {
        try {
            if (userId == null || userId == undefined || userId < 1) {
                res.send(feedback);
            }
            if (amount == null || amount == undefined || amount < 1) {
                feedback.message = 'Please provide credit amount to buy.';
                res.send(feedback);
            }

            var transactionInitiatedAt = moment().format('MM/DD/YYYY hh:mm:ss A');
            var ref = uuid.v4().split('-')[0];
            var transaction = {
                'userId': userId,
                'amount': amount,
                'dateInitiated': transactionInitiatedAt,
                dateCompleted: '',
                paymentReference: ref,
                vogue_ref: '',
                status: 'Pending'
            };

            var transactions = firebaze.child("transactions");
            var transactionStatus = transactions.push(transaction);
            feedback.ref = ref;
            feedback.code = 5;
            feedback.message = 'SUCCESS!';
            res.send(feedback);
        }
        catch (e) {
            return [];
        }
    }

exports.callback = function (req, res, next)
{
    console.log('\n\n' + 'Event Body: ' + JSON.stringify(req.body) + '\n\n');

    var callInfo = req.body;
    var callSid = callInfo.CallSid;
    var fromNumber = callInfo.From;
    var callStatus = callInfo.CallStatus;
    var callDuration = callInfo.CallDuration;
    var duration = callInfo.Duration;
    var called = callInfo.Called;
    var to = callInfo.To;
    var parentSid = callInfo.ParentCallSid;
    var callDirection = callInfo.Direction;
    var timeStamp = moment(callInfo.Timestamp).format('MM/DD/YYYY hh:mm:ss A');

    if (!callSid || callSid.length < 1 || !parentSid || parentSid.length < 1 || !called || called.length < 1 || !to || to.length < 1)
    {
        console.log('Execution returned midway!');
        return res.send('OK');
    }

    if (callStatus === 'completed' || callStatus === 'in-progress')
    {
        console.log('Execution scaled');

        var calls = new Firebase("https://wiretooth.firebaseio.com/calls").orderByChild("callId").equalTo(parentSid);
        calls.once("value", function (callSnapshot)
        {
            if (callSnapshot.val() == null || callSnapshot.val() == undefined)
            {
                res.send('User account could not be updated.');
            }
            else
            {
                var callQuery = callSnapshot.val();
                var callKey = Object.keys(callQuery)[0];
                var call = callQuery[callKey];

                var callRef = new Firebase("https://wiretooth.firebaseio.com/calls/" + callKey);

                var retVal = {code: 5, msg: "It's a red letter day!", lastCall: {}};

                if (callStatus === 'completed')
                {
                    var cost = 0;
                    client.calls(callSid).get(function (err, callRes)
                    {
                        var usd_cost = parseFloat(callRes.price.replace('-', ''));
                        cost = usd_cost * nairaEquivalent;
                    });

                    callRef.update({
                        callStatus: callStatus,
                        duration: callDuration,
                        callDirection: callDirection,
                        endTime: timeStamp,
                        cost: cost,
                        callId: callSid
                    });

                    var wallets = new Firebase("https://wiretooth.firebaseio.com/wallets").orderByChild("phone").equalTo(fromNumber);
                    wallets.once("value", function (walletSnapshot)
                    {
                        if (walletSnapshot.val() !== null && walletSnapshot.val() !== undefined)
                        {
                            var walletQuery = walletSnapshot.val();
                            var walletKey = Object.keys(walletQuery)[0];
                            var wallet = walletQuery[walletKey];

                            //Call duration is returned in seconds. Convert to minute and multiply with destination cost
                            //to get the total call cost
                            var balance = 0;
                            if(!cost || cost === null || cost === undefined)
                            {
                                var durationInMinutes = callDuration / 60;
                                var callCost = call.costPerMinute * durationInMinutes
                                balance = wallet.balance - callCost;
                            }
                            else
                            {
                                balance = wallet.balance - cost;
                            }


                            var walletRef = new Firebase("https://wiretooth.firebaseio.com/wallets/" + walletKey);
                            walletRef.update({balance: balance});

                            retVal.lastCall =
                            {
                                'callId': callSid,
                                startTime: callRef.startTime,
                                endTime: timeStamp,
                                'duration': callDuration,
                                'caller': fromNumber,
                                'callStatus': callStatus,
                                'recipient': to,
                                callCost : callCost,
                                'callDirection': callDirection,
                                'balance': balance
                            };
                            sio.emit('call-completed', retVal);

                        }
                    });
                }

                if (callStatus === 'in-progress')
                {
                    callRef.update({
                        callStatus: callStatus,
                        callDirection: callDirection,
                        startTime: timeStamp,
                        callId: callSid
                    });

                    retVal.lastCall =
                    {
                        callId: callSid,
                        startTime: timeStamp,
                        endTime: '',
                        duration: 0,
                        caller: fromNumber,
                        callStatus: callStatus,
                        recipient: to,
                        callDirection: callDirection
                    };

                    console.log('Call progress updated');
                    sio.emit('call-connected', retVal);
                }

                res.send('Process successfully completed.');
                //var actualDuration = callRef.timeStamp - callRef.startTime;
            }
        });

    }
};

exports.voice = function (req, res, next)
{
    var to = req.body.PhoneNumber;
    var fromNumber = req.body.CallerId;
    var callStatus = req.body.CallStatus;
    var callSid = req.body.CallSid;
    var direction = req.body.Direction;

    console.log('\n\n' + 'Call Info string from voice request : ' + JSON.stringify(req.body) + '\n\n');

    res.type('text/xml');
    res.header('Content-Type', 'text/xml');
    var str = '';

    if (fromNumber == null || fromNumber == undefined || to == null || to == undefined || callSid == null || callSid == undefined || callSid.length < 1) {
        str = '<Response><Say voice="alice" language="en-GB">Your call could not be connected.Please try again later.Thank you</Say><Reject/></Response>';
        res.send(str);
    }

    var wallets = new Firebase("https://wiretooth.firebaseio.com/wallets").orderByChild("phone").equalTo(fromNumber);

    wallets.once("value", function (walletSnapshot) {
        if (walletSnapshot.val() == null || walletSnapshot.val() == undefined) {
            str = '<Response><Say voice="alice" language="en-GB">Your user information could not be verified.Please try again later.Thank you.</Say><Reject/></Response>'
            res.send(str);
        }
        else {
            var walletQuery = walletSnapshot.val();
            var walletKey = Object.keys(walletQuery)[0];
            var wallet = walletQuery[walletKey];
            if (wallet.balance < 2) {
                str = '<Response><Say voice="alice" language="en-GB">Sorry.You do not have sufficient balance to place this call.Please fund your wallet.Thank you.</Say><Reject/></Response>'
                return res.send(str);
            }

            //get destination price details and calculate the possible call duration

            priceApi.voice.numbers(to).get(function (err, number) {
                if (err) {
                    console.log('Price check error : ' + JSON.stringify(err))

                    str = '<Response><Say voice="alice" language="en-GB">Sorry.Your call could not be connected at this time. Please try again later.Thank you.</Say><Reject/></Response>'
                    return res.send(str);
                }

                //console.log('call Price : ' + JSON.stringify(number.outboundCallPrice.currentPrice));

                nairaRateMinute = parseFloat(number.outboundCallPrice.currentPrice) * nairaEquivalent;
                dollarRateMinute = number.outboundCallPrice.currentPrice;

                var rate = (wallet.balance / nairaRateMinute);

                var callTime_second = rate * 60;

                if (callTime_second < 1) {
                    str = '<Response><Say voice="alice" language="en-GB">Sorry.You do not have sufficient balance to place this call. Please update your wallet. Thank you.</Say><Reject/></Response>'
                    return res.send(str);
                }
                else {
                    var duration = Math.ceil(callTime_second);

                    var newCallNode = firebaze.child("calls");

                    var callTime = moment().format('MM/DD/YYYY hh:mm:ss A');
                    var call =
                    {
                        'userId': wallet.userId,
                        'callId': callSid,
                        'startTime': callTime,
                        'duration': '0',
                        'caller': fromNumber,
                        'callStatus': 'initiated',
                        'cost': nairaRateMinute,
                        'recipient': to,
                        'callDirection': direction,
                        'endTime': ''
                    };
                    //console.log('Call Sid from voice request : ' + callSid + '\n\n');
                    sio.emit('voice-event', call);
                    newCallNode.push(call);
                    str = '<Response><Say voice="alice" language="en-GB">Please wait while we connect you to the receiver.Thank you.' +
                        '</Say><Dial callerId="' + fromNumber + '" timeLimit="' + duration + '" timeout="15">' +
                        '<Number statusCallbackEvent="answered completed" statusCallback="http://ab3f6f7c.ngrok.io/callback" statusCallbackMethod="POST">'  //statusCallback="http://a0557d31.ngrok.io/callEvent"
                        + to + '</Number></Dial></Response>'
                    res.send(str); //timeLimit="3" timeout="15"
                }

            });

        }
    });

};

exports.msgEvents = function (req, res, next)
{
        console.log('Request Body in Message Event Callback endpoint : ' + JSON.stringify(req.body));

        var to = req.body.PhoneNumber;
        var fromNumber = req.body.CallerId;
        var messageStatus = req.body.MessageStatus;
        var messageId = req.body.CallSid;
        var errorCode = req.body.ErrorCode;
//smsErrors
        if (fromNumber == null || callStatus == undefined || callSid.length < 1) {
            return res.send('User account could not be updated.');
        }
//delivered
        var wallets = new Firebase("https://wiretooth.firebaseio.com/wallets").orderByChild("phone").equalTo(fromNumber);
        wallets.once("value", function (walletSnapshot) {
            if (walletSnapshot.val() == null || walletSnapshot.val() == undefined) {
                res.send('User account could not be updated.');
            }
            else {
                var walletQuery = walletSnapshot.val();
                var walletKey = Object.keys(walletQuery)[0];
                var wallet = walletQuery[walletKey];

                var rate = (wallet.balance * 60) - callDuration;
                var balance = rate / 60;
                var walletRef = new Firebase("https://wiretooth.firebaseio.com/wallets/" + walletKey);
                walletRef.update({balance: balance});

                var calls = new Firebase("https://wiretooth.firebaseio.com/calls").orderByChild("callId").equalTo(callSid);
                calls.once("value", function (callSnapshot) {
                    if (callSnapshot.val() == null || callSnapshot.val() == undefined) {
                        res.send('User account could not be updated.');
                    }
                    else {
                        var callQuery = callSnapshot.val();
                        var callKey = Object.keys(callQuery)[0];
                        var call = callQuery[callKey];

                        var callRef = new Firebase("https://wiretooth.firebaseio.com/calls/" + callKey);
                        callRef.update({callStatus: callStatus, duration: callDuration, callDirection: callDirection});
                        res.send('Process successfully completed.');
                    }
                });
            }
        });

    };

var feedback = {contactId: '', msg: ''};

exports.getCalls = function (req, res, next)
{
        var retVal = {code: -1, msg: 'An errror wa encountered. Please try again.', calls: [], messages: []};
        retVal.calls = [{"callDirection":"inbound","callId":"CA4ba4ed36358e9a290da6e9791eb9674f","callStatus":"initiated","caller":"+2347018643858","cost":58.96,"duration":"0","endTime":"","recipient":"+2348063858320","startTime":"12/19/2015 04:28:25 PM","userId":"-K2C14Y2IOe9ll1W55JN"},{"callDirection":"inbound","callId":"CAb316969b4ac4fd5ef191c7b8e70d39c9","callStatus":"initiated","caller":"+2347018643858","cost":58.96,"duration":"0","endTime":"","recipient":"+2348063858320","startTime":"12/19/2015 04:44:29 PM","userId":"-K2C14Y2IOe9ll1W55JN"},{"callDirection":"inbound","callId":"CAf82884d29af5d9c2b1e9b015bf87db32","callStatus":"initiated","caller":"+2347018643858","cost":58.96,"duration":"0","endTime":"","recipient":"+2348063858320","startTime":"12/19/2015 04:51:57 PM","userId":"-K2C14Y2IOe9ll1W55JN"},{"callDirection":"inbound","callId":"CA920578f8342d99c309a5fd902b560c46","callStatus":"initiated","caller":"+2347018643858","cost":58.96,"duration":"0","endTime":"","recipient":"+2348063858320","startTime":"12/19/2015 04:57:43 PM","userId":"-K2C14Y2IOe9ll1W55JN"},{"callDirection":"inbound","callId":"CAf5cd78de8c17caf448a3fbac847e75da","callStatus":"initiated","caller":"+2347018643858","cost":58.96,"duration":"0","endTime":"","recipient":"+2348063858320","startTime":"12/19/2015 05:08:41 PM","userId":"-K2C14Y2IOe9ll1W55JN"},{"callDirection":"inbound","callId":"CAcf0c6d81c82c97449b82f490c818750e","callStatus":"initiated","caller":"+2347018643858","cost":58.96,"duration":"0","endTime":"","recipient":"+2348063858320","startTime":"12/19/2015 05:11:25 PM","userId":"-K2C14Y2IOe9ll1W55JN"},{"callDirection":"inbound","callId":"CA1e948e38f40fca3a4428b3f090207453","callStatus":"initiated","caller":"+2347018643858","cost":58.96,"duration":"0","endTime":"","recipient":"+2348063858320","startTime":"12/19/2015 05:16:20 PM","userId":"-K2C14Y2IOe9ll1W55JN"}];

        retVal.code = 5;
        retVal.msg = '';
        res.send(retVal);

        //var userId = req.query.id;
        //if (!userId || userId.length < 1)
        //{
        //    return res.send(retVal);
        //}
        //var calls = new Firebase("https://wiretooth.firebaseio.com/calls").orderByChild("userId").equalTo(userId);
        //calls.once("value", function (callSnapshot)
        //{
        //    if (callSnapshot.val() == null || callSnapshot.val() == undefined)
        //    {
        //        retVal.msg = 'You have not made any calls yet.';
        //        res.send(retVal);
        //    }
        //    else {
        //        var snapVal = callSnapshot.val();
        //        var calls = Object.keys(snapVal);
        //        calls.forEach(function (k)
        //        {
        //            var tCall = snapVal[k];
        //            var existing = retVal.calls.filter(function(q){
        //                return q.callId === k;
        //            });
        //            if(existing.length < 1)
        //            {
        //                retVal.calls.push(snapVal[k]);
        //            }
        //
        //        });
        //
        //        retVal.code = 5;
        //        res.send(retVal);
        //
        //    }
        //});

    };

exports.getMessages = function (req, res, next)
{
        var retVal = {code: -1, msg: 'An errror wa encountered. Please try again.', calls: [], messages: []}
        retVal.msg = 'List is empty.';
        res.send(retVal);

        //var userId = req.query.id;
        //if (!userId || userId.length < 1) {
        //    return res.send(retVal);
        //}
        //var calls = new Firebase("https://wiretooth.firebaseio.com/messages").orderByChild("userId").equalTo(userId);
        //calls.once("value", function (callSnapshot) {
        //    if (callSnapshot.val() == null || callSnapshot.val() == undefined) {
        //        retVal.msg = 'List is empty.';
        //        res.send(retVal);
        //    }
        //    else {
        //        var snapVal = callSnapshot.val();
        //        var messages = Object.keys(snapVal);
        //        messages.forEach(function (k) {
        //            retVal.messages.push(snapVal[k]);
        //        });
        //
        //        retVal.code = 5;
        //        res.send(retVal);
        //
        //    }
        //});

    };

exports.getCallStats = function (req, res, next)
{
        var retVal = {code: -1, msg: 'An errror wa encountered. Please try again.', lastCall: {}};
        var sid = req.query.sid;
        if (!sid || sid.length < 1) {
            return res.send(retVal);
        }
        var calls = new Firebase("https://wiretooth.firebaseio.com/calls").orderByChild("callId").equalTo(sid);
        calls.once("value", function (callSnapshot) {
            if (callSnapshot.val() == null || callSnapshot.val() == undefined) {
                res.send(retVal);
            }
            else {
                var callQuery = callSnapshot.val();
                var callKey = Object.keys(callQuery)[0];
                var call = callQuery[callKey];

                var wallets = new Firebase("https://wiretooth.firebaseio.com/wallets").orderByChild("phone").equalTo(call.caller);
                wallets.once("value", function (walletSnapshot) {
                    if (walletSnapshot.val() == null || walletSnapshot.val() == undefined) {
                        res.send(retVal);
                    }
                    else {
                        var walletQuery = walletSnapshot.val();
                        var walletKey = Object.keys(walletQuery)[0];
                        var wallet = walletQuery[walletKey];
                        retVal.code = 5;
                        retVal.msg = 'The day is bright!';
                        var lastCall =
                        {
                            'callId': call.callId,
                            'timeOfCall': call.timeOfCall,
                            'duration': call.duration,
                            'caller': call.caller,
                            'callStatus': call.callStatus,
                            'recipient': call.recipient,
                            'callDirection': call.callDirection
                        };
                        lastCall.balance = wallet.balance;
                        retVal.lastCall = lastCall;
                        res.send(retVal);
                    }
                });

            }
        });

    };

exports.clearCalls = function (userId)
{
    if(userId == null || userId == undefined || userId.length < 1)
    {
        sio.emit('server-error', 'Internal server error was encountered. Please try again later.');
        return;
    }

    var calls = new Firebase("https://wiretooth.firebaseio.com/calls").orderByChild("userId").equalTo(userId);
    calls.once("value", function (callSnapshot)
    {
        if (callSnapshot.val() == null || callSnapshot.val() == undefined)
        {
            sio.emit('call-log-empty', 'You have not made any calls yet.');
        }
        else {
            var error = false;
            var snapVal = callSnapshot.val();
            var calls = Object.keys(snapVal);
            calls.forEach(function (k)
            {
                var callRef = new Firebase('https://wiretooth.firebaseio.com/calls/' + k);
                callRef.remove(function(error)
                {
                    if (error)
                    {
                        error = true;
                    }
                });
            });

            if(error === true)
            {
                sio.emit('calls-cleared', {code : -1, error : 'Process failed. Please try again later.'});
            }

            else
            {
                sio.emit('calls-cleared', {code : 5, error: 'i gat a green pizza!'});
            }
        }
    });
};

exports.deleteCall = function (payload)
{
    if(payload == null || payload == undefined)
    {
        sio.emit('server-error', 'Internal server error was encountered. Please try again later.');
        return;
    }

    var userId = payload.userId;
    var callId = payload.callId;

    if(userId == null || userId == undefined || userId.length < 1 || !callId || callId === null || callId  == undefined || callId.length < 1)
    {
        sio.emit('server-error', 'Internal server error was encountered. Please try again later.');
        return;
    }

    var calls = new Firebase("https://wiretooth.firebaseio.com/calls").orderByChild("callId").equalTo(callId);
    calls.once("value", function (callSnapshot)
    {
        if (callSnapshot.val() == null || callSnapshot.val() == undefined)
        {
            retVal.msg = 'You have not made any call yet.';
            res.send(retVal);
        }
        else
        {
            var snapVal = callSnapshot.val();
            var call = Object.keys(snapVal)[0];
            var callRef = new Firebase('https://wiretooth.firebaseio.com/calls/' + call);
            callRef.remove(function(error)
            {
                if (error)
                {
                    sio.emit('call-removed', {code : -1, error : 'Process failed. Please try again later.'});
                }
                else
                {
                    sio.emit('call-removed', {code : 5, error: 'i gat a green pizza!', callId : callId});
                }
            });
        }
    });
};

exports.setIo = function (siox)
{
    if(siox)
    {
        sio = siox;
    }
};

