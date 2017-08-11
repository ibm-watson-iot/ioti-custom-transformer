# IoT4I Custom Transfomer

Custom transformer for your device events. So that they can be accepted by our IoT shield engine.

## Wally Provider

This custom transformer shows how a transformer can be implemented for Wally devices.
The provider polls the Wally endpoint for updates, queries all data and checks for new events.
If new events are  found, the provider will publish them

By default the transformer does not filter the source device. If you want the provider to only work with known devices,
you need to switch the `deviceFilter` on in the configuration file. Once enabled the filter will use device information
provided by the IoT4I API service to filter which device data to use.

If deviceFilter is toggled than you need to provide the API configuration information API URL, access token etc.

The example includes a generic adapter to communicate with a rest API.

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
