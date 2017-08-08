# iot4i custom transfomer
Custom transformer for your device events. So that they can be accepted by our IoT Engine.

This custom transformer shows how one can be implemented for Wally devices.
It will poll the Wally endpoint for updates, query all data and check for new events.

On each poll we check for new devices and create them in iotpf. 
The device must be associated with the user beforehand so that we know to which user it belongs.

If new events where found, it will send them to our IoT Platform.

We also provide generic adapter to communicate with a rest API.

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

* upload everything to a server and run `npm start`
