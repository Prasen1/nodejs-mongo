# Nodejs-MongoDB
Catchpoint Integration with MongoDB
---
We can use this integration to pull timeseries data from Catchpoint and store it in MongoDB for analysis or as a long-term test data storage solution.

This integration makes use of a Node.js script that runs at 15 minutes intervals to pull raw performance chart data from the Catchpoint GET: LastRaw API. It can be used to retrieve and store data for a list of tests in the same division. 

## Prerequisites
1. NodeJS v16.x
2. [MongoDB 5.x](https://www.mongodb.com/try/download/community)
3. Catchpoint account with a REST API consumer

## Installation and Configuration
1. Copy the nodejs-mongo folder to your machine
2. Run npm install in the directory /nodejs-mongo

### Configuration
1. In the config_catchpoint.js file under config sub-directory, enter your [Catchpoint API consumer key and secret](https://portal.catchpoint.com/ui/Content/Administration/ApiDetail.aspx)
2. In the tests object of the config_catchpoint.js file, enter the Test IDs you want to pull the data for in an array format. Please ensure to enter only the Test ID in the array belonging to the respective Test Type.

*Example:*

---
    tests: 
    {
        web: [142613,142614,142615,142616],
        transaction: [142602,142603],
        api: [142683,142689,155444],
        ping: [142600],
        traceroute: [142607,142608,142609],
        dns: [942639,142640,142641],
        websocket: [842700],
        smtp: [142604]
    }

---
- In the config_mongo.js file, enter your MongoDB url, database name and collection name where the data will be stored. The default MongoDB URL for a local installation is http://localhost:27017

## How to run
- In the /nodejs-mongo directory, run `node insert_db.js` after uncommenting the `var interval=setInterval(run,900000)` and commenting out the `run()` line in the same file

**or**

- Create a cronjob to run the insert_db.js script every 15 minutes.

*Example crontab entry, if the file resides in /usr/local/bin/insert_db.js*

`*/15 * * * * cd /usr/local/bin/ && node /usr/local/bin/insert_db.js > /usr/local/bin/logs/cronlog.log 2>&1`


## File Structure

    nodejs-mongo/
    ├── auth_handler.js       ## Contains APIs related to authentication       
    ├── config
    | ├── config_catchpoint.js## Configuration file for Catchpoint 
    | ├── config_mongo.js     ## Configuration file for InfluxDB 
    ├── logs
    | ├── info
    | |  ├── info.log         ## Contains informational logs. File name will be based on date of execution
    | ├── error
    | |  ├── error.log        ## Contains error logs. File name will be based on date of execution          
    ├── utils
    | ├── logger.js           ## logger utility
    ├──package.json           ## project dependencies
    └── insert_db.js          ## main file


Once the script starts running and data is inserted into MongoDB, it can queried using [MongoDB shell](https://docs.mongodb.com/manual/tutorial/query-documents/) or directly viewed using [MongoDBCompass](https://www.mongodb.com/products/compass)