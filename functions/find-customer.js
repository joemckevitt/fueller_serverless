'use strict';

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'eu-west-1'});

// Create the DynamoDB service object
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

const tableName = process.env.DYNAMODB_TABLE;

exports.handler =  function(event, context, callback) {
  
    const id = event.id;
    
    findCustomer(id, callback);

};

function findCustomer(id, callback) {
    
    var customer;
    
    var params = {
        TableName: tableName,
        Key: {
            "CustomerId": {S: id}
        }
    };
    
    // Call DynamoDB to read the item from the table
    ddb.getItem(params, function(err, data) {
       if (err) {
           console.log(err, err.stack); // an error occurred
           callback(err);
       }
       else if (data != {}) {
            console.log(data);           // successful response
            if (data.Item)  {
                callback(null, populateCustomer(id, data.Item));
            } else  {
                callback(null, noCustomerFound());
            }
        } else  {
            return null;
        }
    });
}

function populateCustomer(id, customerEntry) {
    
    console.log("entry found for customer no: " + id); 

    var customer = {
         number: customerEntry.CustomerId.S,
         name: customerEntry.Name.S,
         balance: customerEntry.Amount.N
    };
    
    console.log({customer: customer});

    return {
        success: true, 
        customer: customer,
        customerFound: true
    };  

}

function noCustomerFound(data) {
    console.log("customer not found"); 

    return {
        error: true, 
        customerFound: false
    };    
}
