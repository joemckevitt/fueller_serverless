'use strict';

const co = require('co');
const AWS = require('aws-sdk');
AWS.config.region = 'eu-west-1';
const dynamodb = new AWS.DynamoDB.DocumentClient();

let customers = [
  { 
    CustomerId: "001", 
    Amount: 50, 
    Name: "Joe" 
  },
  { 
    CustomerId: "002", 
    Amount: 200, 
    Name: "Joanne" 
  },
  { 
    CustomerId: "003", 
    Amount: 10, 
    Name: "Gordon" 
  },
  { 
    CustomerId: "004", 
    Amount: 435, 
    Name: "Mary" 
  },
  { 
    CustomerId: "005", 
    Amount: 0, 
    Name: "Bill" 
  },
  { 
    CustomerId: "006", 
    Amount: 1000, 
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