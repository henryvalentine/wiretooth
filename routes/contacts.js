
var FireBase = require('firebase'), PhoneNumber = require( 'awesome-phonenumber'), moment = require('moment'), path = require('path'),
    mime = require('mime'), multer = require('multer'), fs = require('fs-extra'),  twilio = require('twilio'),  Firebase = require('firebase'), firebaze = new Firebase('https://wiretooth.firebaseio.com/'),jsonfile = require('jsonfile'),util = require('util');

var feedback = {contactId : '', msg : '', errorList: [], contacts: [], groups: [], code : -1, groupId : ''};

exports.processContact = function (req, res, next)
{
    var name = req.query.name;
    var number = req.query.number;
    var userId = req.query.userId;
    var groupId = req.query.groupId;
    var contactId = req.query.id;

    console.log('Contact Number : ' + number);
    console.log('Contact Name : ' + name);
    console.log('User Id : ' + userId);

    if(userId == null || userId == undefined || userId.length < 1)
    {
        feedback.msg =  "An unknown error was encountered. Please try again later.";
       return res.send(feedback);
    }

    if(name == null || name == undefined || name.length < 1)
    {
        feedback.msg =  "Please provide Contact's Name";
       return res.send(feedback);
    }

    if(number == null || number == undefined || number.length < 1)
    {
        feedback.msg =  "Please provide contact's Phone Number";
        res.send(feedback);
    }
    else
    {
        var contactRef = new Firebase("https://wiretooth.firebaseio.com/contacts").orderByChild("userId").equalTo(userId);
        contactRef.once("value", function (contactSnapshot)
        {
            var numberMatchFound = false;
            var nameMatchFound = false;
            if (contactSnapshot.val() !== null)
            {
                var snapVal = contactSnapshot.val();
                var contacts = Object.keys(snapVal);
                contacts.forEach(function(k)
                {
                    var contact = snapVal[k];
                    var contactName = contact.name;
                    var contactNumber = contact.number;
                    if(contactName.toLowerCase().trim() === name.toLowerCase().trim())
                    {
                        if((contactId && k !== contactId) || (!contactId))
                        {
                            nameMatchFound = true;
                        }

                    }
                    if(contactNumber.trim() === number.trim())
                    {
                        if((contactId && k !== contactId) || (!contactId))
                        {
                            numberMatchFound = true;
                        }

                    }
                });

                if(nameMatchFound === true)
                {
                    feedback.msg = "A contact with similar name already exists.";
                   return res.send(feedback);
                }

                if(numberMatchFound === true)
                {
                    feedback.msg =  "A contact with similar phone number already exists.";
                   return res.send(feedback);
                }

            }

            if(!contactId)
            {
                var contact =  {'userId' : userId, 'name' : name, 'number' : number, groupId : groupId};
                var contact_collection = firebaze.child("contacts");
                var contact_status = contact_collection.push(contact);
                feedback.contactId = contact_status.key();
            }
           else
            {
                var callRef = new Firebase("https://wiretooth.firebaseio.com/contacts/" + contactId);
                callRef.update({'name' : name, 'number' : number, groupId : groupId});
            }
            feedback.code = 5;
            feedback.msg = 'Contact information was successfully saved.';
            res.send(feedback);

        });


    }
};

exports.addContacts = function (req, res, next)
{
    var successCount = 0;
    var contactLists = req.query.contacts;
    if(contactLists == null || contactLists == undefined || contactLists.length < 1)
    {
        feedback.msg =  "An unknown error was encountered. Please try again later.";
        res.send(feedback);
    }

    else
    {
        var contacts = new Firebase("https://wiretooth.firebaseio.com/contacts").orderByChild("userId").equalTo(contactLists[0].userId);
        contacts.once("child_added", function (contactSnapshot)
        {
            var errorList = [];
            if (contactSnapshot.val() == null)
            {
                feedback.msg =  "An unknown error was encountered. Please try again later.";
                res.send(feedback);
            }
            else
            {
                contactLists.forEach(function(c)
                {
                    var name = c.name;
                    var number = c.number;
                    var userId = c.userId;

                    if((userId != null && userId != undefined && userId.length > 0) && (name != null && name != undefined && name.length > 0) && (number != null && number != undefined && number.length > 0)) {

                        var matches = contacts.filter(function (f)
                        {
                            return f.number === number || f.name === name;

                        });

                        if (matches.length < 1)
                        {
                            var contact = {'userId': userId, 'name': name, 'number': number};

                            var contact_collection = firebaze.child("contacts");
                            var contact_status = contact_collection.push(contact);
                            feedback.contactId = contact_status.key();
                            successCount++;
                        }
                        else
                        {
                            //feedback.msg = "Duplicate entries were encountered. Please review the contacts information and try again.";
                            errorList.push(c)
                        }
                    }
                });

                if(successCount === contactLists.length)
                {
                    feedback.msg = 'Contacts were successfully added.';
                    res.send(feedback);
                }
                else
                {
                    if(errorList.length > 0)
                    {
                        feedback.msg =  "Some dupllicates were encoutered.";
                        feedback.errorList = errorList;
                        return  res.send(feedback);
                    }
                    feedback.msg =  "An unknown error was encountered. The request was completed but with errors.";
                    res.send(feedback);
                }
            }
        });

    }
};

exports.editContact = function (req, res, next)
{
    var name = req.query.name;
    var number = req.query.number;
    var id = req.query.id;
    var userId = req.query.userId;

    if(userId == null || userId == undefined || userId.length < 1)
    {
        feedback.msg =  "An unknown error was encountered. Please try again later.";
        res.send(feedback);
    }

    if(name == null || name == undefined || name.length < 1)
    {
        feedback.msg =  "Please provide Contact's Name";
        res.send(feedback);
    }

    if(number == null || number == undefined || number.length < 1)
    {
        feedback.msg =  "Please provide contact's Phone Number";
        res.send(feedback);
    }
    else
    {
        //get contact by it's id
        var contacts = new Firebase("https://wiretooth.firebaseio.com/contacts").orderByKey().equalTo(id);
        contacts.once("value", function (contactSnapshot)
        {

            var c_query = contactSnapshot.val();
            if (c_query == null || c_query == undefined)
            {
                feedback.msg =  "Contact information could not be updated.";
                res.send(feedback);
            }
            else
            {

                var c_queryKey = Object.keys( c_query)[0];

                //update Contact
                var contactRef = new Firebase("https://wiretooth.firebaseio.com/wallets/" + c_queryKey);

                contactRef.update({number : number, name : name});

                feedback.contactId = userId;
                feedback.msg =  "Contact was successfully updated.";
                res.send(feedback);
            }
        });

    }
};

exports.getContacts = function (req, res, next)
{
    feedback.contacts = [{
        "id": "-K2nH4xEM_UT0wBdxiyo",
        "name": "jack V",
        "number": "+2348063858320",
        "groupId": " "
    }, {
        "id": "-K2nNdiWQSYXv4AKm79_",
        "name": "Camaro",
        "number": "+23408175912137",
        "groupId": " "
    }, {
        "id": "-K2zoccV5Gsb6Y2vnQ1z",
        "name": "Kennedy",
        "number": "+2348065732931",
        "groupId": " "
    }, {
        "id": "-K40bGg8ezJPw2lbhuMM",
        "name": "David",
        "number": "+2348099447105",
        "groupId": "-K3h1TnsEDYAZpzc_YIJ"
    }, {
        "id": "-K40bGgEC5aEF0OXHKXz",
        "name": "Chidi",
        "number": "+2348039740811",
        "groupId": "-K3h1TnsEDYAZpzc_YIJ"
    }, {
        "id": "-K40bGgEC5aEF0OXHKY-",
        "name": "Kofi",
        "number": "+2348033341806",
        "groupId": "-K3h1TnsEDYAZpzc_YIJ"
    }, {
        "id": "-K40bGgGO8hknyUbDNzY",
        "name": "Ruth",
        "number": "+2348146205009",
        "groupId": "-K3h1TnsEDYAZpzc_YIJ"
    }, {
        "id": "-K40bGgGO8hknyUbDNzZ",
        "name": "Uchenna",
        "number": "+2348168447101",
        "groupId": "-K3h1TnsEDYAZpzc_YIJ"
    }, {
        "id": "-K40bGgHZgMT66QnOMUi",
        "name": "Dave",
        "number": "+2347036125813",
        "groupId": "-K3h1TnsEDYAZpzc_YIJ"
    }, {"id": "-K40bGgHZgMT66QnOMUj", "name": "eMad", "number": "+2348068627544", "groupId": "-K3h1TnsEDYAZpzc_YIJ"}];
    feedback.code = 5;
    res.send(feedback);

  //try
  //{
  //    var userId = req.query.id;
  //
  //    if(userId == null || userId == undefined || userId.length < 1)
  //    {
  //        feedback.msg =  "An unknown error was encountered. Please try again later.";
  //        res.send(feedback);
  //    }
  //
  //    var contacts = new Firebase("https://wiretooth.firebaseio.com/contacts").orderByChild("userId").equalTo(userId);
  //    contacts.once("value", function (contactSnapshot)
  //    {
  //        if (contactSnapshot.val() !== null)
  //        {
  //            var snapVal = contactSnapshot.val();
  //            contacts = Object.keys(snapVal);
  //            contacts.forEach(function(k)
  //            {
  //                var contact = snapVal[k];
  //
  //                var existing = feedback.contacts.filter(function(q){
  //                    return q.id === k;
  //                });
  //
  //                if(existing.length < 1)
  //                {
  //                    var contactName = contact.name;
  //                    var groupId = contact.groupId;
  //                    var contactNumber = contact.number;
  //                    feedback.contacts.push({id : k, name : contactName, number : contactNumber, groupId : groupId });
  //                }
  //
  //            });
  //            feedback.code = 5;
  //            res.send(feedback);
  //        }
  //        else
  //        {
  //            feedback.msg =  "Contact list is empty.";
  //            return res.send(feedback);
  //        }
  //    });
  //
  //}
  //  catch (e)
  //  {
  //      feedback.msg =  "An unknown error was encountered.";
  //      return res.send(feedback);
  //  }
};

exports.getGroups = function (req, res, next)
{
    var groups = [{"id":"-K3h1TnsEDYAZpzc_YIJ","name":"Board of Directors"}];
    feedback.code = 5;
    return res.send(feedback);
    //try
    //{
    //    var userId = req.query.id;
    //
    //    if(userId == null || userId == undefined || userId.length < 1)
    //    {
    //        feedback.msg =  "An unknown error was encountered. Please try again later.";
    //       return res.send(feedback);
    //    }
    //
    //    var groupList = new Firebase("https://wiretooth.firebaseio.com/groups").orderByChild("userId").equalTo(userId);
    //    groupList.once("value", function (groupVal)
    //    {
    //        if (groupVal.val() !== null)
    //        {
    //            var snapVal = groupVal.val();
    //            var groups = Object.keys(snapVal);
    //            groups.forEach(function(k)
    //            {
    //                var group = snapVal[k];
    //                var groupName = group.name;
    //                var existing = feedback.groups.filter(function(q)
    //                {
    //                    return q.id === group.id;
    //                });
    //                if(existing.length < 1)
    //                {
    //                    feedback.groups.push({id : k, name : groupName});
    //                }
    //
    //            });
    //
    //            feedback.code = 5;
    //            return res.send(feedback);
    //        }
    //        else
    //        {
    //            feedback.msg =  "Contact group list is empty.";
    //            return res.send(feedback);
    //        }
    //    });
    //
    //}
    //catch (e)
    //{
    //    feedback.msg =  "An unknown error was encountered.";
    //    return res.send(feedback);
    //}
};

exports.getContact = function (req, res, next)
{
    var id = req.query.userId;

    if(id == null || id == undefined || id.length < 1)
    {
        feedback.msg =  "An unknown error was encountered. Please try again later.";
        res.send(feedback);
    }

    var contacts = new Firebase("https://wiretooth.firebaseio.com/contacts").orderByKey().equalTo(id);
    contacts.once("value", function (contactSnapshot)
    {
        if (contactSnapshot.val() !== null)
        {
            var contactSnap = contactInfo.val();
            var snap_queryKey = Object.keys(contactSnap)[0];
            var contact = contactSnap[snap_queryKey];
            res.send({id : snap_queryKey, name : contact.name, number : contact.number});
        }
        else
        {
            res.send({});
        }
    });

};

exports.deleteContact = function (req, res, next)
{
    var id = req.query.contactId;
    var userId = req.query.userId;

    if(id == null || id == undefined || id.length < 1)
    {
        feedback.msg =  "Your request could not be completed. Please try again later.";
        res.send(feedback);
    }

    if(userId == null || userId == undefined || userId.length < 1)
    {
        feedback.msg =  "Your request could not be completed. Please try again later.";
        res.send(feedback);
    }

    var contacts = new Firebase("https://wiretooth.firebaseio.com/contacts").orderByKey().equalTo(id);
    contacts.once("value", function (contactSnapshot)
    {
        if (contactSnapshot.val() !== null)
        {
            var contactSnap = contactInfo.val();
            var snap_queryKey = Object.keys(contactSnap)[0];
            var contact = contactSnap[snap_queryKey];

            var contactRef = new Firebase("https://wiretooth.firebaseio.com/contacts/" + id);

            var onComplete = function(error)
            {
                if (error)
                {
                    feedback.msg =  "Your request could not be completed. Please try again later.";
                    res.send(feedback);
                }
                else
                {
                    feedback.msg =  "Contact information was successfully deleted.";
                    res.send(feedback);
                }
            };
            contactRef.remove(onComplete);
        }
        else
        {
            feedback.msg =  "Your request could not be completed. Please try again later.";
            res.send(feedback);
        }
    });

};

exports.addContactGroup = function (req, res, next)
{
    var name = req.query.name;
    var userId = req.query.userId;
    var groupId = req.query.id;

    if(userId == null || userId == undefined || userId.length < 1)
    {
        feedback.msg =  "An unknown error was encountered. Please try again later.";
        return res.send(feedback);
    }

    if(name == null || name == undefined || name.length < 1)
    {
        feedback.msg =  "Please provide Contact's Name";
        return res.send(feedback);
    }

    else
    {
        var contactGroups = new Firebase("https://wiretooth.firebaseio.com/groups").orderByChild("userId").equalTo(userId);
        contactGroups.once("value", function (contactGroupSnapshot)
        {
            var nameMatchFound = false;
            if (contactGroupSnapshot.val() !== null)
            {
                var snapVal = contactGroupSnapshot.val();
                var groups = Object.keys(snapVal);
                groups.forEach(function(k)
                {
                    var group = snapVal[k];
                    var groupName = group.name;
                    if(groupName.toLowerCase().trim() === groupName.toLowerCase().trim())
                    {
                        if((groupId && k !== groupId) || (!groupId))
                        {
                            nameMatchFound = true;
                        }

                    }
                });

                if(nameMatchFound === true)
                {
                    feedback.msg = "A similar contact group already exists.";
                    return res.send(feedback);
                }
            }

            if(!groupId)
            {
                var contactGroupInfo =  {'userId' : userId, 'name' : name};

                var group_collection = firebaze.child("groups");
                var group_status = group_collection.push(contactGroupInfo);
                feedback.groupId = group_status.key();
            }
            else
            {
                var groupRef = new Firebase("https://wiretooth.firebaseio.com/groups/" + groupId);
                groupRef.update({'name' : name});
            }
            feedback.code = 5;
            feedback.msg = 'Group information was successfully saved.';
            res.send(feedback);

        });


    }
};


exports.deleteGroup = function (req, res, next)
{
    var id = req.query.id;
    var userId = req.query.userId;

    if(id == null || id == undefined || id.length < 1)
    {
        feedback.msg =  "Your request could not be completed. Please try again later.";
        res.send(feedback);
    }

    if(userId == null || userId == undefined || userId.length < 1)
    {
        feedback.msg =  "Your request could not be completed. Please try again later.";
        res.send(feedback);
    }

    var groups = new Firebase("https://wiretooth.firebaseio.com/groups").orderByKey().equalTo(id);
    contacts.once("value", function (groupSnapshot)
    {
        if (groupSnapshot.val() !== null)
        {
            var groupSnap = groupSnapshot.val();
            var snap_queryKey = Object.keys(groupSnap)[0];
            var contact = groupSnap[snap_queryKey];

            var fredRef = new Firebase('https://wiretooth.firebaseio.com/groups/'  + id);

            var onComplete = function(error)
            {
                if (error)
                {
                    feedback.msg =  "Your request could not be completed. Please try again later.";
                    res.send(feedback);
                }
                else
                {
                    feedback.msg =  "Group information was successfully deleted.";
                    res.send(feedback);
                }
            };
            fredRef.remove(onComplete);
        }
        else
        {
            feedback.msg =  "Your request could not be completed. Please try again later.";
            res.send(feedback);
        }
    });

};


//exports.downloadTemplate = function (req, res, next)
//{
//    var file = __dirname + '/uploads/bulkTemplates/bulkTemplate.xlsx';
//
//    var filename = path.basename(file);
//    var mimetype = mime.lookup(file);
//
//    res.setHeader('Content-disposition', 'attachment; filename=' + filename);
//    res.setHeader('Content-type', mimetype);
//
//    var filestream = fs.createOutputStream(file);
//    res.send(filestream);
//
//};

