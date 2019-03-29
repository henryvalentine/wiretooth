
var PhoneNumber = require( 'awesome-phonenumber'), querystring = require('query-string'), Firebase = require('firebase'), firebaze = new Firebase('https://wiretooth.firebaseio.com/'), client = require('twilio/lib')('AC9b478e612b78783673f81208722edfd3', '1358efbbe723fefa9f818c6d26e4ddf2'), moment = require('moment');
var sio = {}, db_utilities = require('./dbUtilities');

exports.auth = function (req, res, next)
{
    var number = req.body.phone;
    var password = req.body.password;
    var destinationCode = req.body.code;
    var feedback = {code : -1, history:[], wallet : {}, msg : '', iiq : '', id : '', isNew : false, val_code : '', phoneVerifiedNow : false};

    if(password == null || password == undefined || password.length < 1)
    {
        feedback.msg =  'Please provide your password.';
        return res.send(feedback);
    }

    if(number == null || number == undefined || number.length < 1)
    {
        feedback.msg =  'Please provide a valid phone number (eg: +2348000000000)';
       return res.send(feedback);
    }

    if(destinationCode == null || destinationCode == undefined || destinationCode.length < 1)
    {
        feedback.msg =  'Please provide a valid phone number (eg: +2348000000000)';
       return res.send(feedback);
    }

    //normalize phone number
    var pn = new PhoneNumber(number, destinationCode);
    if(pn.isValid === false)
    {
        feedback.msg =  'Please provide a valid phone number (eg: +2348000000000)';
        res.send(feedback);
    }

    else
    {
        //normalized phone number
        var normalizedNumber = pn.getNumber();
        var email = normalizedNumber + '@wiretooth.com';

        //Authenticate user
        firebaze.authWithPassword({
                email    : email,
                password : password
            }, function(error, authData)
            {
                if (error || error === 'The specified user does not exist')
                {
                    //create user login
                    firebaze.createUser({
                        email    : email,
                        password : password
                    }, function(error, userData)
                    {
                        if (error)
                        {
                            feedback.msg =  'Your account could not be created at this time. Please try again later.';
                            res.send(feedback);
                        }
                        else
                        {
                            //validate user's phone number
                            client.outgoingCallerIds.create(
                                {
                                    friendlyName: normalizedNumber,
                                    phoneNumber: normalizedNumber,
                                    StatusCallback : 'http://1b507ba4.ngrok.io/api/access/phoneVerificationStatus',
                                    StatusCallbackMethod : 'POST'
                                },function(err, callerId)
                                {
                                    if (callerId !== null)
                                    {
                                        feedback.isNew = true;
                                        var errorOccurred = false;
                                        if (err)
                                        {
                                            errorOccurred = true;
                                            console.log('Phone Verification Error : ' + JSON.stringify(err));
                                        }

                                        feedback.val_code = callerId.validation_code;

                                        //create user profile
                                        var registeredDate =  moment().format('MM/DD/YYYY');
                                        var profile = {userId : userData.uid, picturePath : '', dateRegistered : registeredDate, phoneVerified : false, emailVerified : true, phone : normalizedNumber};
                                        var userProfile = firebaze.child("userProfile");
                                        var profileStatus = userProfile.push(profile);
                                        var newWalletNode = firebaze.child("wallets");

                                        //create new Wallet
                                        var lastUpdated = moment().format('MM/DD/YYYY hh:mm:ss A');
                                        var wallet =
                                        {
                                            'userId': profileStatus.key(),
                                            'balance': 0.00,
                                            'lastUpdated': lastUpdated,
                                            'bonus': '0',
                                            'phone' : normalizedNumber,
                                        };

                                        newWalletNode.push(wallet);

                                        feedback.iiq = profileStatus.key();
                                        feedback.id = normalizedNumber;
                                        feedback.code = 5;
                                        feedback.wallet = wallet;
                                        feedback.msg =  errorOccurred === false ? 'Please use this code to verify your phone number : ' + feedback.val_code :  'You were successfully registered but your phone number could not be verified at this time. Please try again later.';

                                        //req.session.user =
                                        //{
                                        //    wallet : wallet,
                                        //    iiq : profileStatus.key(),
                                        //    id : normalizedNumber
                                        //};

                                        //var userData =
                                        //{
                                        //    wallet : wallet,
                                        //    iiq : profileStatus.key(),
                                        //    id : normalizedNumber,
                                        //    isNew : true,
                                        //    val_code : '',
                                        //    phoneVerifiedNow : false
                                        //}
                                        //
                                        //sio.handshake.session.userdata = userData;

                                        res.send(feedback);
                                    }

                                });
                        }
                    });

                } else
                {
                    var userProfile = firebaze.child("userProfile").orderByChild("userId").equalTo(authData.uid);
                    userProfile.once("value", function (profileResponse)
                    {
                        if (profileResponse.val() == null || profileResponse.val() == undefined)
                        {
                            firebaze.unauth();
                            feedback.msg =  'Your account information could not be retrieved. Please try again later.';
                            res.send(feedback);
                        }

                        var p_query = profileResponse.val();
                        var p_queryKey = Object.keys(p_query)[0];
                        feedback.iiq = p_queryKey;
                        feedback.id = p_query[p_queryKey].phone;

                        var profile = p_query[p_queryKey];

                        if (profile.phoneVerified == false || profile.phoneVerified == 'false')
                        {
                            //verify user's phone number
                            client.outgoingCallerIds.create(
                                {
                                    friendlyName: normalizedNumber,
                                    phoneNumber: normalizedNumber,
                                    StatusCallback : 'http://1b507ba4.ngrok.io/api/access/phoneVerificationStatus',
                                    StatusCallbackMethod : 'POST'
                                },function(err, callerId)
                                {
                                    if (callerId !== null && callerId !== undefined)
                                    {
                                        console.log('verification code result : ' + JSON.stringify(callerId));
                                        feedback.phoneVerifiedNow = true;
                                        feedback.val_code = callerId.validationCode;
                                        var wallets = new Firebase("https://wiretooth.firebaseio.com/wallets").orderByChild("userId").equalTo(p_queryKey);

                                        wallets.once("value", function (walletSnapshot)
                                        {
                                            if (walletSnapshot.val() == null || walletSnapshot.val() == undefined)
                                            {
                                                feedback.msg =  'You are successfully logged in but your wallet information could not be retrieved.';
                                                res.send(feedback);
                                            }
                                            else
                                            {
                                                var results = [];
                                                var queries = firebaze.child("transactions").orderByChild("userId").equalTo(p_queryKey);

                                                queries.once("value", function (transactionResponse)
                                                {
                                                    if (transactionResponse.val() !== null)
                                                    {
                                                        var snap = transactionResponse.val();
                                                        results.push(snap);
                                                    }

                                                });

                                                feedback.code = 5;
                                                var wallSnap = walletSnapshot.val();
                                                var snap_queryKey = Object.keys(wallSnap)[0];
                                                feedback.wallet = wallSnap[snap_queryKey];

                                                if(results != null && results.length > 0)
                                                {
                                                    feedback.history = results;
                                                }
                                                feedback.msg =  'Login was successful.';

                                                //var userData =
                                                //{
                                                //    wallet : feedback.wallet,
                                                //    iiq : p_queryKey,
                                                //    id : p_query[p_queryKey].phone,
                                                //    isNew : false,
                                                //    val_code : '',
                                                //    phoneVerifiedNow : true
                                                //}
                                                //
                                                //sio.handshake.session.userdata = userData;

                                                res.send(feedback);
                                            }
                                        });
                                    }

                                });
                        }

                        else{
                            var wallets = new Firebase("https://wiretooth.firebaseio.com/wallets").orderByChild("userId").equalTo(p_queryKey);

                            wallets.once("value", function (walletSnapshot)
                            {
                                if (walletSnapshot.val() == null || walletSnapshot.val() == undefined)
                                {
                                    feedback.msg =  'You are successfully logged in but your wallet information could not be retrieved.';
                                    res.send(feedback);
                                }
                                else
                                {
                                    var results = [];
                                    var queries = firebaze.child("transactions").orderByChild("userId").equalTo(p_queryKey);

                                    queries.once("value", function (transactionResponse)
                                    {
                                        if (transactionResponse.val() !== null)
                                        {
                                            var snap = transactionResponse.val();
                                            results.push(snap);
                                        }

                                    });

                                    feedback.code = 5;
                                    var wallSnap = walletSnapshot.val();
                                    var snap_queryKey = Object.keys(wallSnap)[0];
                                    feedback.wallet = wallSnap[snap_queryKey];

                                    if(results != null && results.length > 0)
                                    {
                                        feedback.history = results;
                                    }
                                    feedback.msg =  'Login was successful.';

                                    //req.session.user =
                                    //{
                                    //    wallet : feedback.wallet,
                                    //    iiq : feedback.iiq,
                                    //    id : feedback.id
                                    //};
                                    //
                                    //var userData =
                                    //{
                                    //    wallet : feedback.wallet,
                                    //    iiq : feedback.iiq,
                                    //    id : feedback.id,
                                    //    isNew : false,
                                    //    val_code : '',
                                    //    phoneVerifiedNow : true
                                    //}
                                    //
                                    //sio.handshake.session.userdata = userData;

                                    res.send(feedback);
                                }
                            });
                        }


                     });

                }
            });
        //}

    }
};

function verifyPhone(normalizedNumber)
{

     return function()
     {
         client.outgoingCallerIds.create(
         {
             friendlyName: normalizedNumber,
             phoneNumber: normalizedNumber,
             StatusCallback : 'http://1b507ba4.ngrok.io/api/access/phoneVerificationStatus',
             StatusCallbackMethod : 'POST'
         },function(err, callerId)
         {
             if (err)
             {
                 return null;
             }
             console.log('verification code result First level : ' + JSON.stringify(callerId));
             return callerId;

         });
     }

};

exports.phoneVerificationStatus = function (req, res, next)
{
    var verificationStatus = req.body.VerificationStatus;
    var callSid = req.body.CallSid;
    var to = req.body.Called

    if(to == null || verificationStatus == undefined || callSid.length < 1)
    {
        res.send('Your phone verification Status could not be updated.');
    }
    if(verificationStatus === 'failed')
    {
        res.send('Your phone verification Status could not be updated.');
    }

    else{
        var userProfile = firebaze.child("userProfile").orderByChild("phone").equalTo(to);
        userProfile.once("value", function (profileResponse)
        {
            if (profileResponse.val() == null || profileResponse.val() == undefined)
            {
                res.send('Your phone verification Status could not be updated.');
            }
            else
            {
                var profile = profileResponse.val();
                var snap_queryKey = Object.keys(profile)[0];
                var caller = profile[snap_queryKey].phone;
                if(caller == null || caller.length < 1)
                {
                    res.send('Your phone verification Status could not be updated.');
                }
                else
                {
                    var userRef = new Firebase("https://wiretooth.firebaseio.com/userProfile/" + snap_queryKey);
                    userRef.update({phoneVerified : true});
                    feedback.successful = true;
                    feedback.message = 'Registration was successfully completed';
                    res.send('Your phone verification Status was successfully updated.');
                }

            }

        });
    }


};

exports.getProfileInfo = function (userId)
{
   var feedback = {code : -1, history:[], wallet : {}, msg : '', iiq : '', id : '', isNew : false, val_code : '', phoneVerifiedNow : false};

    if(userId == null || userId == undefined || userId.length < 1)
    {
        sio.emit('server-error', 'Internal server error was encountered. Please try again later.');
        return;
    }

    var wallets = new Firebase("https://wiretooth.firebaseio.com/wallets").orderByChild("userId").equalTo(userId);

    wallets.once("value", function (walletSnapshot)
    {
        if (walletSnapshot.val() == null || walletSnapshot.val() == undefined)
        {
            sio.emit('server-error', 'Internal server error was encountered. Please try again later.');

        }
        else
        {
            var results = [];
            var queries = firebaze.child("transactions").orderByChild("userId").equalTo(userId);

            queries.once("value", function (transactionResponse)
            {
                if (transactionResponse.val() !== null)
                {
                    var snap = transactionResponse.val();
                    results.push(snap);
                }

            });

            feedback.code = 5;
            var wallSnap = walletSnapshot.val();
            var snap_queryKey = Object.keys(wallSnap)[0];
            feedback.wallet = wallSnap[snap_queryKey];

            if(results != null && results.length > 0)
            {
                feedback.history = results;
            }

            feedback.iiq = userId;
            feedback.id = feedback.wallet.phone;

            feedback.msg =  'get on the rythm.';
            sio.emit('refreshed', feedback);
        }
    });
};

exports.setAuthIo = function (siox)
{
    if(siox)
    {
        sio = siox;
    }
};

