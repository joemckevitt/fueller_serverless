'use strict';

const co = require('co');
const AWS = require('aws-sdk');
AWS.config.region = 'eu-west-1';
const dynamodb = new AWS.DynamoDB.DocumentClient();

let customers = [
  { 
    CustomerId: "001", 
    Amouunt: 50, 
    Name: "Joe" 
  },
  { 
    CustomerId: "002", 
    Amouunt: 200, 
    Name: "Joanne" 
  },
  { 
    CustomerId: "003", 
    Amouunt: 10, 
    Name: "Gordon" 
  },
  { 
    CustomerId: "004", 
    Amouunt: 435, 
    Name: "Mary" 
  },
  { 
    CustomerId: "005", 
    Amouunt: 0, 
    Name: "Bill" 
  },
  { 
    CustomerId: "006", 
    Amouunt: 1000, 
    Name: "Lucy" 
  },
];

let putReqs = customers.map(x => ({
  PutRequest: {
    Item: x
  }
}));

let req = {
  RequestItems: {
    'fueller-serverless-customer-dev': putReqs
  }
};
dynamodb.batchWrite(req).promise().then(() => console.log("all done"));