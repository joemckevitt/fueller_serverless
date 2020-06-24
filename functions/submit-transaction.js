// // Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// // Set the region 
AWS.config.update({region: 'eu-west-1'});
//get SES 
var ses = new AWS.SES({region: 'eu-west-1'});
//var lambda = new AWS.Lambda({region: 'eu-west-1'});

// // Create the DynamoDB service object
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

const tableName = process.env.TRANSACTION_TABLE;

const toAddress = process.env.TO_ADDRESS;

exports.handler =  function(event, context, callback) {

    console.log('Received event:', JSON.stringify(event, null, 2));
    
    if (event.body === undefined) {
        callback(null, wrapResponse(400, "400 Invalid Input"));
    }

    let req = JSON.parse(event.body);
    console.log(`request body is valid JSON`, { requestBody: event.body });

    var transaction = {
        number : req.number,
        amount : req.amount,
        transactionCode : generateTransactionNumber(),
        fuelType : req.fuelType
    }
    
    console.log(transaction);
    
    submitTranscaction(transaction, callback);

};

//Main function
function submitTranscaction(transaction, callback){
  
  console.log("submitTranscation");

  var cust_num = transaction.number;
  var amountOfFuelPuchased = transaction.amount;
  var transactionCode = generateTransactionNumber();
  var fuelType = transaction.fuelType;
    
  appendRowOnTransactionSheet(cust_num, fuelType, amountOfFuelPuchased, transactionCode, callback);

}

function appendRowOnTransactionSheet(cust_num, fuelType, amountOfFuelPuchased, transactionCode, callback){
    var dateTime = generateTimestamp();
    
    console.log("dateTime " + dateTime);
    console.log("customer number " + cust_num);
    console.log("fuelType " + fuelType); 
    console.log("amount " + amountOfFuelPuchased);
    console.log("transactionCode " + transactionCode);
  
    var params = {
        Item: {
            "Timestamp": {
                S: dateTime
            }, 
            "CustNum": {
                N: cust_num
            }, 
            "FuelType": {
                S: fuelType
            },
            "Amount": {
                N: amountOfFuelPuchased
            },
            "TransactionCode": {
            S: " " + transactionCode
            }        
        },
        
        TableName: tableName
    };
     
    ddb.putItem(params, function(err, data) {
        if (err) {
           console.log(err, err.stack); // an error occurred
           callback(err);
        }
        else {
           console.log(data);           // successful response
           //callback(null, data);i
           callback(null, wrapResponse(200, transactionReceipt(transactionCode, cust_num, fuelType, amountOfFuelPuchased)))
        }
    });
    
    transactionReceipt(transactionCode, cust_num, fuelType, amountOfFuelPuchased, callback)

}

function transactionReceipt(transactionCode, cust_num, fuelType, amountOfFuelPuchased, callback)  {
  
    sendEmail(transactionCode, generateTimestamp(), cust_num, fuelType, amountOfFuelPuchased, callback);

  return {
    transactionNumber: transactionCode
  };
    
}


function sendEmail(transactionNo, timestamp, customerNo, fuelType, pumpPrice, callback)    {

  var emailBody =  '   <table>  '  + 
     '   <tbody>  '  + 
     '   <tr>  '  + 
     '   <td><strong>Transaction</strong></td>  '  + 
     '   <td> ' + transactionNo +'</td>  '  + 
     '   </tr>  '  + 
     '   <tr>  '  + 
     '   <td><strong>Timestamp</strong></td>  '  + 
     '   <td> ' + timestamp +'</td>  '  + 
     '   </tr>  '  + 
     '   <tr>  '  + 
     '   <td><strong>Customer Number</strong></td>  '  + 
     '   <td> ' + customerNo +'</td>  '  + 
     '   </tr>  '  + 
     '   <tr>  '  + 
     '   <td>  '  + 
     '   <div><strong>Fuel Type</strong></div>  '  + 
     '   </td>  '  + 
     '   <td> ' + fuelType +'</td>  '  + 
     '   </tr>  '  + 
     '   <tr>  '  + 
     '   <td><strong>Pump Price</strong></td>  '  + 
     '   <td>£' + pumpPrice +'</td>  '  + 
     '   </tr>  '  + 
     '   </tbody>  '  + 
     '  </table>  ' ;
 
  var subject = 'Receipt for Fueller Transaction : ' + transactionNo;

    
     var params = {
        Destination: {
            ToAddresses: [toAddress]
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8", 
                    Data: emailBody
                },
            },
            
            Subject: { Data: subject
                
            }
        },
        Source: "joemckevittrun@gmail.com"
    };

    
     ses.sendEmail(params, function (err, data) {
        callback(null, {err: err, data: data});
        if (err) {
            console.log(err);
            context.fail(err);
        } else {
            
            console.log(data);
            context.succeed(event);
        }
    });

}

function generateTransactionNumber(){
    var min=1; 
    var max=1000000;  
    return Math.floor(Math.random() * (+max - +min)) + +min; 
}

function generateTimestamp(){
  var today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var dateTime = date+' '+time;
  return dateTime;
}

function wrapResponse(statusCode, body) {
    return {
        "statusCode": statusCode,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
          }, 
          
        "body": JSON.stringify(body),
    };
}