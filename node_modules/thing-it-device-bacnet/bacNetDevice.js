/**
 * Created by phil on 22.02.17.
 */

module.exports = {
    metadata: {
        family: 'bacnet',
        plugin: 'bacNetDevice',
        label: 'BACnet Device',
        manufacturer: '',
        discoverable: true,
        additionalSoftware: [],
        actorTypes: [],
        sensorTypes: [],
        services: [],
        configuration: [
            {
                label: "IP Address",
                id: "ipAddress",
                type: {
                    id: "string"
                },
                defaultValue: ""
            },

            {
                label: "BACnet-ID",
                id: "bacNetId",
                type: {
                    id: "string"
                },
                defaultValue: ""
            },

            {
                label: "Device-ID",
                id: "deviceId",
                type: {
                    id: "string"
                },
                defaultValue: ""
            }
        ]
    },
    create: function () {
        return new BacNet();
    },
    discovery: function () {
        return new BacNetDiscovery();
    }
};

var q = require('q');

/**
 *
 * @constructor
 */
function BacNetDiscovery() {
    /**
     *
     * @param options
     */
    BacNetDiscovery.prototype.start = function () {
        this.objects = [];

        if (this.node.isSimulated()) {
            this.timer = setInterval(function () {}.bind(this), 20000);



        } else {
            //TODO: Put in BacNet connector here that can access a BacNet via its API

            //TODO: add bacnet objects / actors via discovery (have a look how it's done in z-wave).

            //TODO: the procedure is to 1) scan the bacnet over the bacnet gateway for objects and 2) to create an actor for each object

            this.logLevel = 'debug';
        }
    };

    /**
     *
     * @param options
     */
    BacNetDiscovery.prototype.stop = function () {
        if (this.timer) {
            clearInterval(this.timer);
        }
    };
}

/**
 *
 * @constructor
 */
function BacNet() {
    /**
     *
     */
    BacNet.prototype.start = function () {
        var deferred = q.defer();
        this.logDebug("****************************");
        this.logDebug("Simulated: " + this.isSimulated());

        if (this.isSimulated()) {
            this.logDebug("Starting BACnet in simulated mode.");

            deferred.resolve();
        } else {

            this.logDebug("Starting BACnet in non-simulated mode.");
            this.logDebug(this.configuration);

            //TODO: Initilize / Connect over BacNetGateway

            deferred.resolve();
        }

        return deferred.promise;
    };

    /**
     *
     */
    BacNet.prototype.stop = function () {
        var deferred = q.defer();

        if (this.isSimulated()) {
            this.logDebug("Stopping BACnet in simulated mode.");
        } else {
            //TODO: Disconnect from BacNetGateway
            //this.zWave.disconnect();
        }

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    BacNet.prototype.getState = function () {
        return {};
    };

    /**
     *
     */
    BacNet.prototype.setState = function () {
    };
}

