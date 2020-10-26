# Flex.Query Processor Library

## Table of Contents
-  [Introduction](#introduction)
-  [Important Notes](#important-notes)
-  [Installation](#installation)
-  [Define Connection](#define-connection)
-  [Syntax Introduction](#syntax-introduction)
-  [Methods Introduction](#methods-introduction)
-  [Preset Connection](#preset-connection)
-  [Retrieve From Database](#retrieve-from-database)
    - [About StoredProcedure](#about-storedprocedure)
    - [About Options](#about-options)
        - [JSON Data Type](#json-data-type)
        - [Timestamp Data Type](#timestamp-data-type)
-  [Insert, Update and Delete](#insert-update-and-delete)
-  [Transaction](#transaction)
## Introduction

### Objective
- The Company -  FLEX-SOLVER PTE LTD

To create a clean and standardized format for mysql query call when writing APIs.

Hence, this library was created on top of the [OFFICIAL MYSQL LIBRARY](https://github.com/mysqljs/mysql#introduction). 

We recommend you to try out mysql library first before you start with this wrapper.

### Features
- Connect to Mysql database.
- Easy query to the database.
- Easy parse data from the database withuot introducing models.

## Important Notes 
### Important Notes #1 -About Promise (Latest 20/05/2018)

In this library, most of the functions return promises. We highly encourage developers to practice on [await-async (read me to find out why).](https://hackernoon.com/6-reasons-why-javascripts-async-await-blows-promises-away-tutorial-c7ec10518dd9)

### Important Notes #2 -About Returns (Latest 20/05/2018)

As mentioned, the library is written on top of the offical library, we only did minimal changes in the returned data to ease the data parsing.

Apart from that, you may refer to 
1. [JSON Data Type](#json-data-type)
2. [Timestamp Data Type](#timestamp-data-type)



## Installation
This is a Node.js module available through the [npm registry](https://www.npmjs.com/).

Before installing, download and install Node.js. Node.js 8.0 or higher is required.

Installation is done using the npm install command:

```
$ npm install flexqp
```

## Define Connection

The recommended way to define connection is to create a json file like this:

```
{
    "host" : "localhost",
    "user" : "admin",
    "password" : "p@55w0rd",
    "database" : "world"    
}

```

Alternatively, you can also create an connection object which serve the same purpose upon establishing connection like this:

```
let dbConnection = {
    host : "localhost",
    user : "admin",
    password : "p@55w0rd",
    database : "world"    
}
```
In order to standardize the code in the following example, we will use the first method by using: `require('dbConnection.json');` 




## Syntax Introduction

You can simply find out the purpose of all APIs using the definition table here:

Syntax  | Definition | :star:
------------- | ------------- | -------------
`execute`  | Send this SQL query to the database | :star::star::star::star::star:
`AndFetch`  | Perform a `select` or `call` statement call | :star::star::star::star:
`Update`  | Perform `update`, `delete`, `insert` statement call | :star::star::star::star:
`First`  | Retrieve the `first result` if exists else `null` | :star::star::star:
`Promise`  | This returns as a promise | :star::star::star::star::star:
`Ignore`  | Even if this query did not pass, this Promise will always resolve by itself | :star::star:
~~`End`~~  | ~~End the http request straight away~~ (Consider to deprecate this soon) | :star:

## Methods Introduction

 Method Name  | Usage 
------------- | -------------
`presetConnection`  | [Preset Connection](#preset-connection) 
`connectWithTbegin`  | Creates a temporary connection that begins a transaction - see [Transaction](#transaction)
`executeAndFetchPromise`  | Perform a `select` or `call` statement call 
`executeAndFetchFirstPromise`  | Perform a `select` or `call` statement call and return the first result 
`executeUpdatePromise`  | Perform a query and returns database result such as affected rows, insertId back 
`executeUpdateIgnorePromise`  | Perform a query and returns database result or error object back 

## Preset Connection
If you are only using `one database` and `one connection`, you are recommended to preset connection upon running the server. 

With the preset connection, you no longer need to define your connection before you perform any sql query call via the following example:
```
var qp = require('flexqp');
var dbConnection = require('./dbConnection.json');
qp.presetConnection(dbConnection);

```

Just remember, if you did not declare the database connection in the following method, this library will always be using the default/preset configuration for you.

In other words, you are not required to define database credential after you have preset the connection.

## Retrieve From Database
If you would like to write a function that performs select statement, you may do so like the following example.

```
var qp = require('flexqp');
var dbConnection = require('./dbConnection.json');
qp.presetConnection(dbConnection);


async function getUsers(){
    //select the whole array of users
   var result1 = await qp.executeAndFetchPromise('select * from users');
   return result1;
}

async function getActiveUsers(){
    //select the whole array of active users
   var result2 = await qp.executeAndFetchPromise('select * from users where status = ?', ['ACTIVE']);
    return result2;
}

async function getSpecific(_name){
    //select a specific user
   var result3 = await qp.executeAndFetchFirstPromise('select * from users where name like ?', [_name]);
    return result3;
}

```

### About StoredProcedure
Coming Soon....

### About Options
Coming Soon....

### JSON Data Type
Coming Soon....

### Timestamp Data Type
Coming Soon....

## Insert, Update and Delete
If you would like to write a function that performs insert/update/delete statement, you may do so like the following example.

```
var qp = require('flexqp');
var dbConnection = require('./dbConnection.json');
qp.presetConnection(dbConnection);


async function insertUser(user){
    //select the whole array of users
   var result1 = await qp.executeUpdatePromise('insert into users set ?', [user]);
   return result1;
}

async function updateUser(user, originalId){
    //select the whole array of active users
   var result2 = await qp.executeUpdatePromise('update users set ? where id = ?', [user, originalId]);
    return result2;
}

async function deleteUser(_name){
    //select a specific user
   var result3 = await qp.executeUpdatePromise('delete from users where name like ?', [_name]);
    return result3;
}

```


## Transaction
If you would like to write multiple query statements but within a transaction, you may do so like the following example.

```
var qp = require('flexqp');
var dbConnection = require('./dbConnection.json');
qp.presetConnection(dbConnection);

async function aTransaction(user, originalId, _name) {    
    var con;
    try {
         //Create a temporary connection that begins a transaction using the above declared database connection
        con = await qp.connectWithTbegin();
        
         //Do some changes to the database with execute - allows us to pass our con object as the connection we want to connect to our database with
        await qp.execute('insert into users set ?', [user], con);
        await qp.execute('update users set ? where id = ?, [user, originalId], con);
        await qp.execute('delete from users where name like ?', [_name], con);

         //If all is fine, commit the changes and close the connection
        await qp.commmitAndCloseConnection(con);
        
    } catch (err) {
         //If an error occurs during the transaction, catch it and roll back the changes made to the database
        await qp.rollbackAndCloseConnection(con);
    }
}

```

Do note that if there is an error after commitAndCloseConnection(con) in the try block, calling rollbackAndCloseConnection(con) in the error block will result in the error where the query cannot be enqueued after the connection has already been closed. Therefore, try to use transactions as a stand-alone function.
