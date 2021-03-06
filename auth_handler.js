// dependent packages and files required
import fetch from 'node-fetch';
import config from './config/config_catchpoint.js';
import log from './utils/logger.js';

const token_url = `${config.base_url}${config.token_path}`;

// Function to get Authentication token from catchpoint api
function get_token(clientId, clientSecret) {
  return new Promise((resolve, reject) => {
    log.info("<<Getting Token>>")
    fetch(token_url,
      {
        method: 'POST',
        body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      .then(res => res.json())
      .then(json => {
        // response errors are set in the Message property of the response.
        if (json.hasOwnProperty('Message')) {
          throw json.Message;
        } else {
          log.info("<<Received Token>>");
          resolve(json.access_token)
        }
      }).catch(err => {
        log.error(err);
        reject(err);
      }
      );
  });
}

export {
  get_token
}
