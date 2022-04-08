/* dependent packages and files required */
import fetch from 'node-fetch';
import log from './utils/logger.js';
import { get_token } from './auth_handler.js';
import config from './config/config_catchpoint.js';
import config_mongo from './config/config_mongo.js';
import { MongoClient } from 'mongodb';

/* 

functions:
        Function Name                   Description
    fetch_Data            :     function to fetch data from LastRaw API
    convert_data          :     function to transform JSON from LastRaw API to Documents
    write_data            :     function to insert Documents into MongoDB
    get_token             :     function to get Access token 

*/

// Global Variable
const raw_data_url = `${config.base_url}${config.last_raw_path}`;
const client_key = config.client_key;
const client_secret = config.client_secret;
const db_url = config_mongo.url;
const db_name = config_mongo.db;
const db_collection = config_mongo.collection;
const test_types = config.tests;
const client = new MongoClient(db_url);

// main function to fetch and store data
async function run() {
    try {
        const token = await get_token(client_key, client_secret);
        let tests_list = [];
        // breakdown the tests list into chunks of 50 test ids for each test type
        Object.keys(test_types).forEach(function (key, index) {
            let temp = [], chunk = 50;
            for (let i = 0, j = test_types[key].length; i < j; i += chunk) {
                temp.push(test_types[key].slice(i, i + chunk));
            }
            tests_list.push(temp);
        });
        for (let tests of tests_list) {
            for (let arr of tests) {
                let url = `${raw_data_url}${arr}`;
                let raw_data = await fetch_Data(token, url);
                let docs = convert_data(raw_data);
                if (docs != "No Data") {
                    await write_data(docs);
                }
                else {
                    log.info("No Data for the last 15 minutes");
                }
            }
        }
    }
    catch (err) {
        let error = new Error(err);
        log.error(error);
    }
}

// function to fetch Raw Data
async function fetch_Data(token, url) {
    let response = await fetch(url, {
        headers: {
            'accept': 'application/json',
            'authorization': `Bearer ${token}`
        }
    })
        .then(res => res.json())
        .then(json => {
            // if object has property Message, display Error, else Process Data
            if (json.hasOwnProperty('Message')) {
                log.error(`${json.Message}`);
            } else {
                log.info("<<Fetched Raw Test Data>>", url, `Raw Data Start Timestamp: ${json.start} End Timestamp: ${json.end}`)
                if (json.hasOwnProperty('error')) {
                    log.error(`${json.error}`, "<<Check Catchpoint configuration file>>")
                }
                return json;
            }
        }).catch(err => {
            log.error(err);
        }
        );
    return response;
}
// function to parse and transform JSON received from API to Document structure for MongoDB
function convert_data(structure) {
    // Checks if there is test data for the last 15 mins
    if (structure['detail'] != null) {

        let items = []
        let test_params = []
        let test_metric_values = []
        let temp = {}
        let solution = {}
        for (let value of structure?.detail?.fields?.synthetic_metrics) {
            let metrics = value['name']
            test_params.push(metrics)
        }
        for (let value of structure?.detail?.items) {
            let metric_values = value['synthetic_metrics']
            let flag = true
            let temp = {}
            temp.timestamp = {}
            for (let i in value) {
                if (i != 'synthetic_metrics') {
                    switch (i) {
                        case "dimension":
                            temp.timestamp = value[i]['name']
                            break;
                        case "breakdown_1":
                            temp[i] = value[i]['name']
                            break;
                        case "breakdown_2":
                            temp[i] = value[i]['name']
                            break;
                        case "hop_number":
                            temp[i] = value[i]
                            break;
                        case "step":
                            temp[i] = value[i]
                            break;
                    }
                }
            }            
            if (flag) {
                metric_values.push(temp)
                test_metric_values.push(metric_values)
            }
        }
        for (let test_metric_value of test_metric_values) {
            temp = {}
            temp.metrics = {}
            for (let i = 0; i < test_metric_value.length; i++) {
                if (typeof (test_metric_value[i]) != "object")
                    temp.metrics[test_params[i]] = test_metric_value[i]
                else
                    for (let value in test_metric_value[i]) {
                        temp[value] = test_metric_value[i][value]
                    }
            }
            items.push(temp)
        }
        solution['items'] = items
        return solution['items'];
    }
    else {
        log.info(structure)
        return ("No Data");
    }
}
// function to insert Documents into MongoDB
async function write_data(docs) {
    try {
        log.info("<<#Documents to insert>>", docs.length)
        await client.connect();
        const database = client.db(db_name);
        const rawdata_collection = database.collection(db_collection);
        // insert an array of documents
        const result = await rawdata_collection.insertMany(docs);
        log.info(`<<${result.insertedCount} documents were inserted>>`);
    }
    catch (err) {
        log.error(err);
    }
    finally {
        //close db connection
        await client.close();
    }
}
//Run the main function
//var interval=setInterval(run,900000)
run();
