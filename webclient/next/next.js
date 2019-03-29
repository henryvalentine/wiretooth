'use strict';
define(['wireTooth','communicationsService'], function (app) {

  app.register.controller('callsController', ['$scope','$rootScope','$routeParams','communicationsService', 'socket',function($scope, $rootScope, $routeParams, communicationsService,socket)
  {

    /********************************************  CALLS ******************************************/

    var caller = angular.element('#call');
    var flashCaller = angular.element('#flashCallerBtn');
    var placeholder = angular.element('#flashCaller');

    $rootScope.callInfo = {'number' : ''};
    $rootScope.csT = '0.00k';
    $rootScope.hours = '00';
    $rootScope.minutes ='00';
    $rootScope.seconds ='00';
    $rootScope.tw_device = {};
    $rootScope.phone = {number : ''};

    $rootScope.setDefaults = function()
    {
      //$rootScope.getToken();
      $rootScope.phone = {'number' : ''};
      $rootScope.normalizing = false;
      if($rootScope.wallet != null && $rootScope.wallet !== undefined && $rootScope.wallet.userId !== null && $rootScope.wallet.userId.length > 0)
      {
        $rootScope.getToken();
      }
    };

    socket.on("call-completed", function(data)
    {
       var inf = data.lastCall;
       $rootScope.wallet.balance = inf.balance;
      $rootScope.histories.push({
          'userId': $rootScope.wallet.userId,
          'callId': inf.callSid,
          'startTime': inf.startTime,
          'duration': inf.duration,
          'caller': inf.caller,
          'callStatus': inf.callStatus,
          'costPerMinute': inf.costPerMinute,
          'recipient': inf.recipient,
          'callDirection': inf.callDirection,
          'endTime': inf.endTime
      });

      //check active timer and stop it
      $rootScope.stopCount();
      setTimeout(function()
      {
        $rootScope.calling = false;
        angular.element('#realtime').html('00 : 00 : 00');
      }, 10000);

    });

    socket.on("call-connected", function(data)
    {
      //check active caller view and start timer
      if (flashCaller.hasClass("call-drop"))
      {
        $rootScope.startCount('realtime2');
        return;
      }

      if (caller.hasClass("call-drop"))
      {
        $rootScope.startCount('realtime');
      }

    });

    $rootScope.clearCalls =  function()
    {
      if(!confirm('sure to clear your calls?'))
      {
        return;
      }
      if($rootScope.calls.length > 0)
      {
        socket.emit('clear-calls',$rootScope.wallet.userId);
      }
    };

    socket.on("calls-cleared", function(data)
    {
       if(data.code > 0)
       {
         $rootScope.calls = [];
         $rootScope.callList = [];
       }
      else
       {
         alert(data.error);
       }
    });

    $rootScope.deleteCall = function (id)
    {
      if(!id || id.length < 1)
      {
        alert('call cannot be removed now. Please try again later.')
        return;
      }

      if(!confirm('sure to delete this call?'))
      {
        return;
      }
      if($rootScope.calls.length > 0)
      {
        socket.emit('remove-call',{userId : $rootScope.wallet.userId, callId : id});
      }
    };

    socket.on("call-removed", function(data)
    {
      if(data.code > 0)
      {
       angular.forEach($rootScope.calls, function(c, i)
       {
          if(c.callId === data.callId)
          {
            $rootScope.calls.splice(i, 1);
          }
       });

        angular.forEach($rootScope.callList, function(c, i)
        {
          if(c.callId === data.callId)
          {
            $rootScope.calls.splice(i, 1);
          }
        });
      }
      else
      {
        alert(data.error);
      }
    });

    $rootScope.getToken =  function()
    {
      var payload = {phoneNumber : $rootScope.wallet.id};
      communicationsService.getToken(payload, $rootScope.getTokenCompleted)
    };

    /*HANDLE CALLS BY CLICKING ON A CONTACT FROM CONTACTS VIEW*/
    $rootScope.callContact = function(contact)
    {
      if(!contact || contact.number.length < 1)
      {
        return;
      }

      if(contact.name.length > 0)
      {
        placeholder.text(contact.name);
      }
      else
      {
        placeholder.text(contact.number);
      }

      var destinationInfo = $rootScope.getDestinationCode(contact.number);

      if(destinationInfo === undefined || destinationInfo === null || destinationInfo.dial_code.length < 1)
      {
        return;
      }
      destinationInfo.number = contact.number;
      $rootScope.flashCallInfo = destinationInfo;
      $rootScope.showflashCall();
    };

    //FOR POP CALLS FROM CALL LOG
    $rootScope.callFlashContact = function (number)
    {
      if(!number || number.length < 1)
      {
        alert('call could not be placed. Please try again later.');
        return;
      }

      //IF THE CALL WAS MADE TO A PROFILED CONTACT, FIND AND DISPLAY CONTACT'S NAME
      var contact = {name : '', number : ''};
      angular.forEach($rootScope.contacts, function(c, i)
      {
        if(c.number === number)
        {
          if(c.name.length > 0)
          {
            placeholder.text(c.name);
          }
          else
          {
            placeholder.text(c.number);
          }

          contact = c
        }
      });

      if(contact.name.length < 1 && contact.number.length < 1)
      {
        contact = {name : number, number : number};
      }

      //GET CALL DESTINATION
      var destinationInfo = $rootScope.getDestinationCode(contact.number);

      if(destinationInfo === undefined || destinationInfo === null || destinationInfo.dial_code.length < 1)
      {
        return;
      }
      destinationInfo.number = contact.number;
      $rootScope.flashCallInfo = destinationInfo;

      //SHOW POP UP CALL
      $rootScope.closeCallLog();
      $rootScope.showflashCall();

    };

    $rootScope.refreshDev =  function()
    {
      var payload = {phoneNumber : $rootScope.wallet.id};
      communicationsService.getToken(payload, $rootScope.resetDevice)
    };

    $rootScope.resetDevice =  function(response)
    {
      $rootScope.token = response;
      if (response === undefined || response == null)
      {
        alert('sorry a communication session could not be initiated now. Please try again later.');
        return;
      }

      Twilio.Device.setup(response);
    };

    $rootScope.getTokenCompleted =  function(response)
    {
      $rootScope.token = response;
      if(response === undefined || response == null)
      {
        alert('sorry a communication session could not be initiated now. Please try again later.');
        return;
      }

      Twilio.Device.setup(response); //, {debug:true}

      Twilio.Device.ready(function()
      {

      });

      Twilio.Device.offline(function()
      {
         //Called on network connection lost.
        console.log('Device is offline');

        if($rootScope.wallet != null && $rootScope.wallet !== undefined && $rootScope.wallet.userId !== null && $rootScope.wallet.userId.length > 0)
        {
          $rootScope.refreshDev()
          //console.log('Refreshing device....');
        }

      });

      Twilio.Device.incoming(function(conn)
      {
        console.log(conn.parameters.From); // who is calling
        conn.status ;// => "pending"
        conn.accept();
        conn.status; // => "connecting"
      });

      Twilio.Device.connect(function (conn)
      {
        console.log("Call Sid from conn: " + conn.parameters.CallSid);
      });

      Twilio.Device.cancel(function(conn)
      {
        console.log(conn.parameters.From); // who canceled the call
        conn.status;// => "closed"
        $rootScope.csT = 0;
        Twilio.Device.disconnectAll();
        caller.removeClass('call-drop').addClass('call-active');
      });

      Twilio.Device.disconnect(function (conn)
      {
        Twilio.Device.disconnectAll();
        caller.removeClass('call-drop').addClass('call-active');
        flashCaller.removeClass('call-drop').addClass('call-active');
        //resetTimeOut();
        //communicationsService.getCllStats({sid : conn.parameters.CallSid}, $rootScope.getCllStatsCompleted)
      });

      Twilio.Device.presence(function (presenceEvent)
      {
        // Called for each available client when this device becomes ready
        // and every time another client's availability changes.
        presenceEvent.from;// => name of client whose availability changed
        presenceEvent.available;// => true or false
      });

      Twilio.Device.error(function (e)
      {
        angular.element('#call').removeClass('call-drop').addClass('call-active');
      });

    };

    $rootScope.showflashCall = function()
    {
      angular.element(".popUpBg").show();
      angular.element("#flashCall").fadeIn('fast');
    };

    $rootScope.closeflashCall = function()
    {
      angular.element('#flashCall').hide();
      angular.element(".popUpBg").hide();
      angular.element('#realtime2').html('00 : 00 : 00');
    };

    var dTimer = '';
    function get_device_status()
    {
      dTimer = setInterval(function()
      {
         var st = Twilio.Device.status();
        console.log('Device Status : ' + JSON.stringify(st));
        if(st === 'completed')
        {
          resetTimeOut();
        }
      }, 1000);
    }

    function resetTimeOut()
    {
       clearInterval(dTimer);
    }

    $rootScope.getCllStatsCompleted  = function(res)
    {
      if(res.code < 1)
      {
        return;
      }

      var lstCll = res.lastCall;
      $rootScope.lastCall = res.lastCall;
      $rootScope.callStats = true;
      $rootScope.wallet.balance = res.lastCall.balance;
      $rootScope.calls.unshift(lstCll);
    };

    $rootScope.normalizeNumber2 = function()
    {

      $rootScope.callStats2 = false;

      if($rootScope.wallet == null || $rootScope.wallet == undefined || $rootScope.wallet.userId == null || $rootScope.wallet.userId.length < 1)
      {
        $rootScope.showLoginForm();
        return;
      }

      if (flashCaller.hasClass("call-drop"))
      {
        Twilio.Device.disconnectAll();
        flashCaller.removeClass('call-drop').addClass('call-active');
        return;
      }

      $rootScope.calling = false;
      if($rootScope.flashCallInfo == null || $rootScope.flashCallInfo == undefined || $rootScope.flashCallInfo.dial_code.trim() == '' || $rootScope.flashCallInfo.number === undefined || $rootScope.flashCallInfo.number.trim().length < 1)
      {
        console.log('Please provide call destination.');
        return;
      }

      var gt = $rootScope.token && $rootScope.token.length > 0 ? false : true;

      var phoneNumber = $rootScope.flashCallInfo.number.trim();
      var destinationCode = $rootScope.flashCallInfo.dial_code;
      angular.element('#norm-flasher').fadeIn();
      communicationsService.normalize({number: phoneNumber, code : destinationCode, userId : $rootScope.wallet.userId, gt : gt, phoneNumber : $rootScope.wallet.id}, getDestinationCostSuccess2);

    };

    $rootScope.normalizeNumber = function()
    {

      $rootScope.callStats = false;

      if($rootScope.wallet == null || $rootScope.wallet == undefined || $rootScope.wallet.userId == null || $rootScope.wallet.userId.length < 1)
      {
        $rootScope.showLoginForm();
        return;
      }

      if (caller.hasClass("call-drop"))
      {
        Twilio.Device.disconnectAll();
        caller.removeClass('call-drop').addClass('call-active');
        return;
      }

      console.log($rootScope.lInfo);

      $rootScope.calling = false;
      if($rootScope.lInfo == null || $rootScope.lInfo == undefined || $rootScope.lInfo.dial_code.trim() == '' || $rootScope.lInfo.number === undefined || $rootScope.lInfo.number.trim().length < 1)
      {
        console.log('Please provide call destination.');
        return;
      }

      var gt = $rootScope.token && $rootScope.token.length > 0 ? false : true;

      var phoneNumber = $rootScope.lInfo.number.trim();
      var destinationCode = $rootScope.lInfo.dial_code;
      angular.element('#norm-loder').fadeIn();
      communicationsService.normalize({number: phoneNumber, code : destinationCode, userId : $rootScope.wallet.userId, gt : gt, phoneNumber : $rootScope.wallet.id}, getDestinationCostSuccess);

    };

    $rootScope.checkBalance = function()
    {
      walletService.checkBalance({userId: $rootScope.wallet.userId}).then(success,failure);
    };

    function success(res)
    {
      console.log(res);
    }

    $rootScope.setCursorPosition = function (e)
    {
      if($rootScope.phone.number !== null &&$rootScope.phone.number !== undefined &&$rootScope.phone.number.trim().length > 0)
      {
        var el = (e.srcElement || e.target);
        el.setCaretPosition($rootScope.phone.number.length -1);
      }
    };

    $rootScope.deleteCharacter = function ()
    {
      var number =$rootScope.phone.number.trim();
      if(number == null || number == undefined || number.length < 1)
      {
        return;
      }

      $rootScope.phone.number = number.slice(0, number.length-1);
      angular.element('#numberHolder').focus();
    };

    function getDestinationCostSuccess2(res)
    {
      angular.element('#norm-flasher').fadeOut();

      if(res.res_code < 1)
      {
        alert(res.msg);
        return;
      }

      $rootScope.csT = res.rate_min_NGN.toFixed(2) + 'k';

      if(res._token !== undefined && res._token.length > 0)
      {
        $rootScope.getTokenCompleted(res._token);
      }

      $rootScope.twiCall2(res.number);
    }

    $rootScope.twiCall2 =  function(number)
    {
      if (flashCaller.hasClass("call-drop"))
      {
        Twilio.Device.disconnectAll();
        flashCaller.removeClass('call-drop').addClass('call-active');
      }
      else
      {
        Twilio.Device.connect(
            {
              CallerId: $rootScope.wallet.id,
              PhoneNumber:number
            });
        flashCaller.removeClass('call-active').addClass('call-drop');
      }
    };

    function getDestinationCostSuccess(res)
    {
      angular.element('#norm-loder').fadeOut();

      if(res.res_code < 1)
      {
        alert(res.msg);
        return;
      }

      $rootScope.csT = res.rate_min_NGN.toFixed(2) + 'k';

      if(res._token !== undefined && res._token.length > 0)
      {
        $rootScope.getTokenCompleted(res._token);
      }

      $rootScope.twiCall(res.number);
    }

    $rootScope.twiCall =  function(number)
    {
      if (caller.hasClass("call-drop"))
      {
        Twilio.Device.disconnectAll();
        caller.removeClass('call-drop').addClass('call-active');
      }
      else
      {
        Twilio.Device.connect(
            {
              CallerId: $rootScope.wallet.id,
              PhoneNumber:number
            });
        caller.removeClass('call-active').addClass('call-drop');
      }
    };

    function getDestinationCostFailure(res)
    {
      console.log(res);
    }

    function geoFailureCallBack(res)
    {
      console.log(res);
    }

    function failure(res)
    {
      console.log(res);
    }

    $rootScope.setCalled = function(recipients)
    {
      if(recipients === undefined || recipients == null || recipients.length < 1)
      {
        return;
      }

      var r = recipients[0];
      var recipientNumber = '';
      if(r.isOriginalObject === true)
      {
        recipientNumber = r.originalObject.number;
      }
      else
      {
        recipientNumber = r.title;
      }

      if(recipientNumber === undefined || recipientNumber === null || recipientNumber.length < 1)
      {
        return;
      }

      var destinationInfo = $rootScope.getDestinationCode(recipientNumber);

      if(destinationInfo === undefined || destinationInfo === null || destinationInfo.dial_code.length < 1)
      {
        return;
      }
      else
      {
        destinationInfo.number = recipientNumber;
        $rootScope.lInfo = destinationInfo;
      }


    };

    //Call timer handler
    var timer;
    var hour = 0, mins = 0, secs = 0;
    var elem = '';
    $rootScope.startCount = function(id)
    {
      elem = id;
      timer = setInterval(count,1000);
    }

    $rootScope.stopCount = function()
    {
      clearInterval(timer);
    }

    function count()
    {
      secs++;
      if (secs==60)
      {
        secs = 0;
        mins += 1;
      }
      if (mins==60)
      {
        mins=0;
        hour += 1;
      }
//  if (hour==13)
//  {
//    hour=1;
//  }

      angular.element("#" + elem).text(plz(hour) +":" + plz(mins) + ":" + plz(secs));
    }

    function plz(digit)
    {
      var zpad = digit + '';
      if (digit < 10)
      {
        zpad = "0" + zpad;
      }
      return zpad;
    }



  /*%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%  MESSAGING   %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*/

    $rootScope.showCompose = function()
    {
      angular.element(".popUpBg").show();
      angular.element("#compose").fadeIn('fast');
    };

    $rootScope.closeCompose = function()
    {
      angular.element('#compose').hide();
      angular.element(".popUpBg").fadeOut();
    };

    $rootScope.showFlashCompose = function()
    {
      angular.element(".popUpBg").show();
      angular.element("#flashMsg").fadeIn('fast');
    };

    $rootScope.closeFlashCompose = function()
    {
      angular.element('#flashMsg').hide();
      angular.element(".popUpBg").fadeOut();
    };

    $rootScope.flashMsgInfo = {'recipient' : '', 'message' : ''};

    $rootScope.msgInfo = {'recipient' : '', 'message' : ''};

    $rootScope.bulkMsgInfo = {'recipients' : [], 'message' : ''};


    /*HANDLE MESSAGING BY CLICKING ON A CONTACT FROM CONTACTS VIEW*/
    $rootScope.prepSms = function(contact)
    {
      if(!contact || contact.number.length < 1)
      {
        return;
      }
      var placeholder = angular.element('#flashMsger')

      if(contact.name.length > 0)
      {
        placeholder.text(contact.name);
      }
      else
      {
        placeholder.text(contact.number);
      }
      var destinationInfo = $rootScope.getDestinationCode(contact.number);

      if(destinationInfo === undefined || destinationInfo === null || destinationInfo.dial_code.length < 1)
      {
        return;
      }

      destinationInfo.number = contact.number;
      $rootScope.flashMsgInfo = destinationInfo;
      $rootScope.flashRecipient = {number : contact.number, destinationCode : destinationInfo.dial_code, iso : destinationInfo.code} ;
      $rootScope.showFlashCompose();
    };

    $rootScope.reset = function()
    {
      $rootScope.count = 0;
      $rootScope.messageCount = 0;
    };

    function geoSuccessCallBack(res)
    {
      $rootScope.destinationCountry = null;
      $rootScope.ip = res.ip;
      angular.forEach($rootScope.countries, function(c, i)
      {
        if(c.code === res.country_code)
        {
          $rootScope.destinationCountry = c;
          $rootScope.destinationCountry_local = c;
        }
      });

      if( $rootScope.destinationCountry == null ||  $rootScope.destinationCountry == undefined)
      {
        $rootScope.destinationCountry = {'code' : '', 'dial_code' : '', 'number' : '', 'name' : 'Unknown'};
      }

    }

    $rootScope.sendFlashText = function()
    {
      var message = $rootScope.flashMsgInfo.message.trim();
      if($rootScope.wallet == null || $rootScope.wallet == undefined || $rootScope.wallet.userId == null || $rootScope.wallet.userId.length < 1)
      {
        $rootScope.showLoginForm();
        return;
      }

      if(!$rootScope.flashRecipient || $rootScope.flashRecipient.number.length < 1)
      {
         alert('Please provide message recipient');
         return;
      }

      if(!message || message.length < 1)
      {
        alert('Please provide a message');
        return;
      }

      communicationsService.sendSms({from : $rootScope.wallet.id, to: [$rootScope.flashRecipient], userId : $rootScope.wallet.userId, body : message, p : 1}, sendSmsCallBack);
    };

    //todo: $rootScope.getDestinationCode(msg.number)

    $rootScope.sendText = function()
    {
      var message = $rootScope.msgInfo.message.trim();
      if($rootScope.wallet == null || $rootScope.wallet == undefined || $rootScope.wallet.userId == null || $rootScope.wallet.userId.length < 1)
      {
        $rootScope.showLoginForm();
        return;
      }

      if(!$rootScope.recipients || $rootScope.recipients.length < 1)
      {
        alert('Please provide at least one recipient');
        return;
      }

      if(!message || message.length < 1)
      {
        alert('Please provide a message');
        return;
      }

      communicationsService.sendSms({from : $rootScope.wallet.id, to: $rootScope.recipients, userId : $rootScope.wallet.userId, body : message, p : 0}, sendSmsCallBack);
    };

    $rootScope.checkBalance = function()
    {
      walletService.checkBalance({userId: 2}).then(success,failure);
    };

    function success(res)
    {
      console.log(res);
    }

    function sendSmsCallBack(res)
    {
      alert(res.msg);
    }

    $rootScope.setRecipients = function(recipients)
    {
      if(recipients === undefined || recipients == null || recipients.length < 1)
      {
        return;
      }

      $rootScope.recipients = []

      angular.forEach(recipients, function(r, i)
      {
        var recipientNumber = '';
        if(r.isOriginalObject === true)
        {
          recipientNumber = r.originalObject.number;
        }
        else
        {
          recipientNumber = r.title;
        }

        if(recipientNumber === undefined || recipientNumber === null || recipientNumber.length < 1)
        {
          return;
        }

        var destinationInfo = $rootScope.getDestinationCode(recipientNumber);
        if(destinationInfo === undefined || destinationInfo === null || destinationInfo.dial_code.length < 1)
        {
          return;
        }
        else
        {
          $rootScope.recipients.push({number : recipientNumber, destinationCode : destinationInfo.dial_code, iso : destinationInfo.code}) ;
        }

      });

      console.log(JSON.stringify($rootScope.recipients));
    };

    $rootScope.sendBulkSms = function()
    {
      var message =  $rootScope.bulkMsgInfo.message.trim();
      var recipients = $rootScope.bulkMsgInfo.recipients;

      if($rootScope.wallet == null || $rootScope.wallet == undefined || $rootScope.wallet.userId == null || $rootScope.wallet.userId.length < 1)
      {
        $rootScope.showLoginForm();
        return;
      }

      if(!recipients || recipients.length < 1)
      {
        alert('Please select at least one group');
        return;
      }

      if(!message || message.length < 1)
      {
        alert('Please provide a message');
        return;
      }
      communicationsService.sendBulkSms({from : $rootScope.wallet.id, to: recipients, userId : $rootScope.wallet.userId, body : message, p : msgPages}, sendSmsCallBack);
    };

    $rootScope.selectedGroups = [];
    $rootScope.multiselectSettings = {displayProp: 'name', idProp: 'id', checkboxes : true,dynamicTitle : true,
      buttonDefaultText : 'select contact group(s)', enableSearch : true, 'search-filter' : 'name', dynamicButtonTextSuffix : 'selected', buttonClasses : 'btn btn-default col-md-12'};


    //MANAGE CONTACTS

    $rootScope.search = {text :''};
    $rootScope.callSearch = {text :''};

    $rootScope.showContacts = function()
    {
      angular.element(".popUpBg").show();
      angular.element("#contacts").slideDown();
    };

    $rootScope.closeContacts = function()
    {
      angular.element("#contacts").hide();
      angular.element(".popUpBg").hide();
    };

    $rootScope.editContact = function(contact)
    {
      if(!contact || contact.number.length < 1)
      {
        return;
      }

      if(contact.groupId !== undefined && contact.groupId !== null && contact.groupId.length > 0)
      {
        var groups =  $rootScope.contactGroups.filter(function(g){
          return g.id === contact.groupId;
        });

        if(groups.length > 0)
        {
          contact.group = groups[0];
        }
      }

      $rootScope.contact = contact;
      angular.element('#groups').hide();
      angular.element('#cntC').show();
      $rootScope.showContacts();
    };

    $rootScope.processContact = function()
    {
      if($rootScope.wallet == null || $rootScope.wallet == undefined || $rootScope.wallet.userId == null || $rootScope.wallet.userId.length < 1)
      {
        $rootScope.closeContacts();
        $rootScope.showLoginForm();
        return;
      }

      if ($rootScope.contact.name == null || $rootScope.contact.name.length < 1)
      {
        alert("Please provide contact's name.");
        return;
      }

      if ($rootScope.contact.number == null || $rootScope.contact.number.length < 1)
      {
        alert("Please provide contact's Number.");
        return;
      }
      if ($rootScope.contact.group !== null && $rootScope.contact.group.id.length > 0)
      {
        $rootScope.contact.groupId = $rootScope.contact.group.id;
      }

      $rootScope.contact.userId = $rootScope.wallet.userId;
      $rootScope.busy = true;
      //communicationsService.processContact($rootScope.contact, processContactCompleted);

      $rootScope.AjaxPost($rootScope.contact, serverRoot + 'contacts/processContact',processContactCompleted);

    };

    function processContactCompleted (response)
    {
      $rootScope.busy = false;
      alert(response.msg);
      if (response.code < 1)
      {
        return;
      }

      $rootScope.closeContacts();

      if ($rootScope.contact.id == null || $rootScope.contact.id.length < 1)
      {
        $rootScope.contact.id = response.contactId;
        $rootScope.contacts.push($rootScope.contact);
      }
      else
      {
        var cInfoList = $rootScope.contacts.filter(function(c)
        {
          return c.id == $rootScope.contact.id;
        });
        if(cInfoList.length < 1)
        {
          //alert('Your request could not be completed.');
          return;
        }
        cInfoList[0].number = $rootScope.contact.number;
        cInfoList[0].name =  $rootScope.contact.name;
      }

    };

    function processGroupCompleted (response)
    {
      $rootScope.busy = false;
      alert(response.msg);
      if (response.code < 1)
      {
        return;
      }

      if ($rootScope.grp.id == null || $rootScope.grp.id.length < 1)
      {
        $rootScope.grp.id = response.groupId;
        $rootScope.contactGroups.push($rootScope.grp);
      }
      else
      {
        var cInfoList = $rootScope.contactGroups.filter(function(c)
        {
          return c.id == $rootScope.grp.id;
        });
        if(cInfoList.length < 1)
        {
          return;
        }
        cInfoList[0].name =  $rootScope.grp.name;
        $rootScope.grp = {name : '', id:''};
      }
    };

    $rootScope.grp = {name : '', id:''};

    $rootScope.editGroup = function(grp)
    {
      if (grp.id == null || grp.id.length < 1)
      {
        alert("Please select Group.");
        return;
      }
      $rootScope.grp = grp;
    };

    $rootScope.processGroup = function()
    {
      if($rootScope.wallet == null || $rootScope.wallet == undefined || $rootScope.wallet.userId == null || $rootScope.wallet.userId.length < 1)
      {
        $rootScope.closeContacts();
        $rootScope.showLoginForm();
        return;
      }

      if ($rootScope.grp.name == null || $rootScope.grp.name.length < 1)
      {
        alert("Please provide contact Group name.");
        return;
      }

      $rootScope.grp.userId = $rootScope.wallet.userId;
      $rootScope.busy = true;
      //communicationsService.processGroup($rootScope.grp, processGroupCompleted);
      $rootScope.AjaxPost($rootScope.grp, serverRoot + 'contacts/processGroup',processGroupCompleted);

    };

    function deleteGroupCompleted (response)
    {
      alert(response.msg);
      if (response.code < 1)
      {
        return;
      }

      angular.forEach($rootScope.contactGroups, function(c, i)
      {
        if(c.id == $rootScope.grp.id)
        {
          $rootScope.contactGroups.splice(i,1);
        }
      });

    };

    $rootScope.searchContact = function(search)
    {
      if(search && search.trim().length > 0)
      {
        var searchToLower = search.toLowerCase();

        var matches = $rootScope.contacts.filter(function(c)
        {
          return (c.name.toLowerCase().indexOf(searchToLower) > -1 || c.number.toLowerCase().indexOf(searchToLower) > -1);
        });

        if(matches.length > 0)
        {
          $rootScope.contactsTempate = matches;
        }
      }
      else
      {
        $rootScope.contactsTempate = $rootScope.contacts;
      }
    };

    $rootScope.searchCalls = function(search)
    {
      if(search && search.trim().length > 0)
      {
        var searchToLower = search.toLowerCase();

        var matches = $rootScope.calls.filter(function(c)
        {
          return (c.name.toLowerCase().indexOf(searchToLower) > -1 || c.callDirection.toLowerCase().indexOf(searchToLower) > -1);
        });

        if(matches.length > 0)
        {
          $rootScope.callList = matches;
        }
      }
      else
      {
        $rootScope.callList = $rootScope.contacts;
      }
    };


    $rootScope.deleteGroup = function(){
      if($rootScope.wallet == null || $rootScope.wallet == undefined || $rootScope.wallet.userId == null || $rootScope.wallet.userId.length < 1)
      {
        $rootScope.closeContacts();
        $rootScope.showLoginForm();
        return;
      }

      if ($rootScope.grp.id == null || $rootScope.grp.id.length < 1)
      {
        alert("Please select Group.");
        return;
      }

      $rootScope.grp.userId = $rootScope.wallet.userId;

      //communicationsService.deleteGroup($rootScope.grp, deleteGroupCompleted);

      $rootScope.AjaxPost($rootScope.grp, serverRoot + 'contacts/deleteGroup',deleteGroupCompleted);

    };


    /*#######################################################  MANAGE WALLET  ####################################################################*/

    $rootScope.transaction = {amount : ''};

    $rootScope.showWallet = function()
    {
      angular.element(".popUpBg").show();
      angular.element("#wallet_fund").slideDown();
    };

    $rootScope.closeWallet = function()
    {
      angular.element("#wallet_fund").hide();
      angular.element(".popUpBg").hide();
    };

    $rootScope.initiateTransaction = function(transaction)
    {
      if($rootScope.wallet == null || $rootScope.wallet == undefined || $rootScope.wallet.userId == null || $rootScope.wallet.userId.length < 1)
      {
        $rootScope.closeWallet();
        $rootScope.showLoginForm();
        return;
      }

      var transactionAmount = angular.element('#recamount').val();
      console.log(JSON.stringify(transactionAmount));
      if(transactionAmount.trim().length < 1)
      {
        alert('Please provide credit amount to buy.');
        return;
      }
      if(parseFloat(transactionAmount) < 50)
      {
        alert('Please purchase a minimum credit of NGN50.');
        return;
      }

      var payload = {amount : transactionAmount, userId : $rootScope.wallet.userId};
      communicationsService.initiateTransaction(payload, initiateTransactionCompleted);

    };

    function initiateTransactionCompleted (res)
    {
      if(res.code < 1)
      {
        alert(res.message);
        return;
      }

      angular.element('#tr_ref').val(res.ref);
      var tref = angular.element('#tr_ref').val();
      if(tref == null  || tref.length < 1)
      {
        alert('Transaction Reference could not be set');
        return;
      }
      angular.element('#fund_wallet').submit();
    };

  }]);

  //callsController.$inject = ['$scope','$rootScope','$routeParams','communicationsService', '$timeout'];
  //app.register.controller("callsController", callsController);
});

