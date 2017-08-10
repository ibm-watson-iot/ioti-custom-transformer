# iot4i custom transfomer
Custom transformer for your device events. So that they can be accepted by our IoT shield engine.

This custom transformer shows how a transformer can be implemented for Wally devices.

In short, it will poll the Wally endpoint for updates, query all data and check for new events.
We only check for updates on known devices. 

Therefore the device Id must be associated with the user beforehand 
so that we know that it exists and to which user it belongs.
This can be done through our API service.

If new events where found, it will add the userId to them and send them to our IoT Platform 
and then arrive at the shield engine. 
That is why we also check if the device is already registered in the IoTPlatform, and if not we register it. 

Finally, we also provide a generic adapter to communicate with a rest API.

### Configuration
The configuration file is in `app/config`.
By default it will use the `config-dev.js` file. If you want another file to be used, set the environment
variable `APP_ENV` to another name, e.g. `prod` to use the file `config-prod.js`.


## Prerequisites

You will need the following things properly installed on your computer.

* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/) (with NPM, >= 6.10.1)

## Installation

* `git clone <repository-url>` this repository
* `cd iot4i-custom-transformer`
* `npm install`

## Running / Development

* `npm start`

### Deploying

* upload the source code to a server and run 
  * `npm install`
  * `npm start`
