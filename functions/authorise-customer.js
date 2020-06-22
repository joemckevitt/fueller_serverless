// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'eu-west-1'});

// Create the DynamoDB service object
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

const tableName = process.env.DYNAMODB_TABLE;

exports.handler =  function(event, context, callback) {

    console.log('Received event:', JSON.stringify(event, null, 2));
    
    if (event.body === undefined) {
        callback(null, wrapResponse(400, "400 Invalid Input"));
    }

    let req = JSON.parse(event.body);
    console.log(`request body is valid JSON`, { requestBody: event.body });

    const id = req.id;

    var customerRequest = {
        fuelType: req.fuelType,
        amount: req.amount
    }
    
    findCustomerAndAuthorise(id, customerRequest, callback);
};

function findCustomerAndAuthorise(id, customerRequest, callback) {
    
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
                callback(null, populateCustomerAndAuthorise(id, data.Item, customerRequest, callback));
            } else  {
                callback(null, noCustomerFound());
            }
        } else  {
            return null;
        }
    });
}

function populateCustomerAndAuthorise(id, customerEntry, customerRequest, callback) {
    
    console.log("entry found for customer no: " + id); 

    var customer = {
         number: customerEntry.CustomerId.S,
         name: customerEntry.Name.S,
         balance: customerEntry.Amount.N
    };
    
    console.log({customer: customer});

    isCustomerAuthorisedWrapper(customer, customerRequest, callback);

}

function isCustomerAuthorisedWrapper(customer, customerRequest, callback)  {

    //business logic
    var result = prePaidLogicForIsAuthorised(customer, customerRequest);
    
    //TODO audit row (log in a table)
    auditRow(customer, customerRequest, result);
    
    var response;
    if (result.isAuthorised == false) {
      response = {
          success: true, 
          customer: result.customer,
          isAuthorised: result.isAuthorised
      };
    } else {
         response = {
          success: true, 
          customer: result.customer,
          isAuthorised: result.isAuthorised,
      };
    }
    
    callback(null, wrapResponse(200, response));

}

function prePaidLogicForIsAuthorised(customer, request) {

    //TODO make a local variable and remove global
    var isAuthorised = false;
    var discountedAmount = 0;
    
    var amountOfFuelPuchased = request.amount;

    var customerFound = customer != null;

    if (customerFound != null)  {
        var pumpPriceDetails = findPumpPrice();
        discountedAmount = applyDiscount(amountOfFuelPuchased, request.fuelType, pumpPriceDetails)
        //TODO calculate shortfall...
    }    
  
  return {
     isAuthorised: isAuthorisedForTransaction(customer, discountedAmount),
     discountedAmount: discountedAmount,
     customer: customerFound
   };

    
}

function noCustomerFound(data) {
    console.log("customer not found"); 

    var responseBody = {
        success: false, 
        customer: null,
        isAuthorised: false
    };  

    //TODO revisit status code ...shouldn't be 200
    return wrapResponse(200, responseBody);
}


function findPumpPrice(callback) {
    
    return  {
      diesel: 1,
      petrol: 2, 
    };

}

function applyDiscount(amountPurchased, fuelType, pumpPriceDetails)    {
    
    //TODO valid inputs (check for valid fuelType)
    console.log("***** applyDiscount *****");
    
    fuelType = fuelType.toLowerCase();
    console.log("fuelType : " + fuelType);
    
    if (fuelType == "diesel") {
    var discountPrice = pumpPriceDetails.diesel;    
    } else if (fuelType == "petrol") {
    var discountPrice = pumpPriceDetails.petrol;    
    } else {
      throw new Error('unrecognised fuel type!');
    }
    
    console.log("amountPurchased " + amountPurchased); 
    console.log("fuelType " + fuelType); 
    console.log("discountPrice " + discountPrice); 
    
    var result = amountPurchased * discountPrice;
    console.log("discount amount calculated " + result); 
    console.log("***** applyDiscount *****"); 
    
    return result;
    
}

function isAuthorisedForTransaction(customer, amountOwed)   {
    
    if (customer != null && amountOwed < customer.balance) {
        console.log("Authorised");   
        return true;
    } else {
        console.log("NOT Authorised - Request customer to top-up"); 
        return false;
    }     
}

function auditRow(customer, request, result) {
    
    //TODO look to audit row (log in a table)
    var fields = ["customer number", customer.number,
                "name", (customer ? customer.name : "undefined"),
                "balance", (customer ? customer.balance : "undefined"),
                "fuel type", request.fuelType,
                "originalAmount", request.amount,
                "discountedAmount", (result.discountedAmount ? result.discountedAmount : "undefined"),
                "isAuthorised", result.isAuthorised,];
    
    console.log("***** Audit Activity *****");
    console.log(fields);
    console.log("***** Audit Activity *****");
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