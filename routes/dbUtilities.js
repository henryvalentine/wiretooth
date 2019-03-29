
var mongoClient = require('mongodb').MongoClient, assert = require('assert'), db_root_url = 'mongodb://localhost:27017/', objectId = require('mongodb').ObjectID;;

function connect ()
{
  mongoClient.connect(db_root_url + 'test', function(err, db)
  {
    assert.equal(null, err);
    console.log('DB up and running');
    db.close();
  });
};

exports.insert = function(entity, entity_name, db_name)
{
  mongoClient.connect(db_root_url + db_name, function(err, db)
  {
    if(err)
    {
      return {code : -1, error : err};
    }

    //insert

    db.close();
  });
};
exports.update = function(entity, db_name)
{

};

exports.insert_list = function(entity, db_name)
{

};

exports.delete = function(entity, db_name)
{

};

exports.delete_list = function(entity, db)
{

};