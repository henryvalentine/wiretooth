var express = require('express'),wallet = require('wallet'),calling = require('calling'),communications = require('./routes/communications'),
    misc = require('./routes/miscellaneous'),contacts = require('./routes/contacts'),mime = require('mime'),multer = require('multer'),
    path = require('path'),fs = require('fs-extra'),Excel = require('exceljs'),access = require('./routes/auth'),Firebase = require('firebase'), firebaze = new Firebase('https://wiretooth.firebaseio.com/'),
    bodyParser = require('body-parser'),app = require('express')(), server = require("http").createServer(app), io = require("socket.io")(server), unique = new Date().toISOString(),
    session = require("express-session")({secret: unique, resave: true, saveUninitialized: true}), sharedsession = require('express-socket.io-session');

app.use(session);

// Share session with io sockets
io.use(sharedsession(session,
    {
        autoSave: true
    }));

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

// (Cross-Origin Resource Sharing) headers to support Cross-site HTTP requests
app.all('*', function(req, res, next)
{
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(express.static(__dirname + '/webclient'));

app.get('/', function(req, res)
{
      path = 'io.html';
      res.sendFile(path, {root: './webclient'});
});

app.get('/walletUpdate', function(req, res)
{
      path = 'walletUpdate/walletUpdate.html';
      res.sendFile(path, {root: './webclient'});
});

app.get('/etisHts', function(req, res)
{
    path = 'next/etisHts.html';
    res.sendFile(path, {root: './webclient'});
});

//ROUTES

//COMMUNICATIONS ROUTES
app.get('/api/calling/getToken', calling.getToken);
app.post('/api/communications/normalize', communications.normalize);
app.post('/api/communications/sendSms', communications.sendSms);
app.get('/api/communications/getCalls', communications.getCalls);
app.get('/api/communications/getCllStats', communications.getCallStats);
app.get('/api/communications/getMessages', communications.getMessages);
app.get('/api/session/RefreshSession', calling.getToken);
app.post('/voice', communications.voice);
app.post('/callback', communications.callback);
app.post('/msgEvents', communications.msgEvents);

//WALLET ROUTES
app.post('/api/wallet/voguResponse', wallet.voguResponse);
app.post('/api/wallet/initiateTransaction', wallet.initiateTransaction);
app.get('/api/wallet/getHistory/:id', wallet.getHistory);
app.get('/api/wallet/getUserWalletHistory', wallet.getUserWalletHistory);

//USER MANAGEMENT ROUTES
app.post('/api/access/auth', access.auth);
app.post('/api/access/phoneVerificationStatus', access.phoneVerificationStatus);

//CONTACT MANAGEMENT ROUTES
app.post('/api/contacts/processContact', contacts.processContact);
app.post('/api/contacts/addContacts', contacts.addContacts);
app.post('/api/contacts/editContact', contacts.editContact);
app.get('/api/contacts/getContacts', contacts.getContacts);
app.get('/api/contacts/getGroups', contacts.getGroups);
app.get('/api/contacts/getContact', contacts.getContact);
app.post('/api/contacts/processGroup', contacts.addContactGroup);
app.post('/api/contacts/deleteGroup', contacts.deleteGroup);
app.post('/api/contacts/deleteContact', contacts.deleteContact);

//MISCELLANEOUS
app.post('/api/misc/feedback', misc.contactUs);
app.post('/api/misc/invite', misc.inviteFriend);

var feedback = {contactId : '', msg : '', errorList: [], contacts: [], groups: [], code : -1, groupId : ''};
var upload = multer({
    dest: path.join(__dirname, 'uploads', 'users' , 'bulkFiles/'),
    limits:
    {
        fileSize: 1024000
    }
});

var type = upload.single('file');
app.post('/api/contacts/uploadContacts', type, function(req, res)
{
    console.log('Uploaded file : ' + JSON.stringify( req.file));

    var jsonList = [];

    var userId = req.body.userId;
    var groupId = req.body.groupId;

    var file = req.file;
    var filePath = file.path;

    // read from a file
    var workbook = new Excel.Workbook();
    workbook.xlsx.readFile(filePath)
        .then(function()
        {
             var worksheet = workbook.getWorksheet(1);
            if(worksheet !== undefined && worksheet !== null)
            {
                worksheet.eachRow(function(row, rowNumber)
                {
                    if(row !== undefined && row !== null && rowNumber > 1)
                    {
                        jsonList.push({name : row.getCell(1).value, number : '+' + row.getCell(2).value, 'userId': userId, groupId : groupId});
                    }
                });

                console.log(" Uploaded contacts : " + JSON.stringify(jsonList));

                fs.remove(filePath, function (err)
                {
                    if(err)
                    {
                        console.log("File delete error : " + JSON.stringify(err));
                    }
                });

                if (jsonList.length < 1)
                {
                    feedback.msg =  "File content could not be read. Please try again later.";
                    return res.send(feedback);
                }
                else
                {
                    var userContacts = [];
                    var contactRef = new Firebase("https://wiretooth.firebaseio.com/contacts").orderByChild("userId").equalTo(userId);
                    contactRef.once("value", function (contactSnapshot)
                    {
                        if (contactSnapshot.val() !== null)
                        {
                            var snapVal = contactSnapshot.val();
                            var contacts = Object.keys(snapVal);
                            contacts.forEach(function(k)
                            {
                                var contact = snapVal[k];
                                var contactName = contact.name;
                                var contactNumber = contact.number;
                                userContacts.push({name : contact.name, number : contact.number, groupId : contact.groupId, id : k});
                            });
                        }

                        jsonList.forEach(function(k)
                        {
                            var numberMatchFound = false;
                            var NumberDuplicates = userContacts.filter(function(c)
                            {
                                return c.number === k.number;
                            });

                            if(NumberDuplicates.length > 0)
                            {
                                numberMatchFound = true;
                                k.msg =  "A contact with similar phone number already exists.";
                                feedback.errorList.push(k);
                            }

                            if(!numberMatchFound)
                            {
                                var contact =  {'userId' : userId, 'name' : k.name, number : k.number, groupId : groupId};
                                var contact_collection = firebaze.child("contacts");
                                var contact_status = contact_collection.push(contact);
                                contact.id = contact_status.key();
                                feedback.contacts.push(contact);
                            }
                        });

                        if(feedback.contacts.length === jsonList.length)
                        {
                            feedback.code = 5;
                            feedback.msg = feedback.contacts.length + ' contacts were successfully saved.';
                            fs.remove(file.path)
                            res.send(feedback);
                        }
                        else
                        {
                            feedback.msg = 'Request was not completed. Please try again later.';
                            fs.remove(file.path)
                            res.send(feedback);
                        }

                    });
                }
            }

        });
})

// development error handler
// will print stacktrace
if (app.get('env') === 'development')
{
    app.use(function (err, req, res, next)
    {
        res.status(err.status || 500).send({message: err.message,error: err});

    });
}

var port = process.env.PORT || 4000;

server.listen(port, function ()
{
    console.dir("Express/Socket server started on port " + port);
});

require('./routes/socket-base')(io);

module.exports = app;