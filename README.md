**thing-it-node** allows you to 
* connect controllers like Arduino Uno to your computer (e.g. a Raspberry Pi) to centralize Internet access to a scalable set of Sensors and Actors,
* invoke REST services on all Actors,
* receive WebSocket notifications on all Sensor data changes and events,
* define higher-level services on multiple Actors and also invoke those via REST and
* define Complex Event Processing on Sensor data changes and events. 

All of the above is controlled by a **[nodejs](http://nodejs.org/)** server which is bootstrapped from a simple JSON configuration.

# Philosophy

**thing-it-node** is created because we felt the need for a scalable management entity which bridges Internet services and devices. It is not intended to compete with but rather complement and use (great) libraries like

* **[Johnny Five](https://github.com/rwaldron/johnny-five/wiki/Board)** or
* aREST from Marco Schwarz

# Getting Started

Let's try to set up a simple - but not too simple - home automation scenario:

1. Two LEDs representing e.g. two lamps.
1. An LDR to detect the light in a room and event processing to switch both lamps if the light goes below some threshold.
1. Two buttons to toggle the state of each lamps.
1. A simple (mobile capable) web application to toggle the state of both lamps individually and together and to display the event under 2.

To setup this scenario you need the following hardware

* an Arduino Uno board
* two LEDs e.g.
* an LDR, e.g. 
* two buttons, e.g.
* possibly a breadboard (e.g. ) and some jumper cables

all of the above is also available with Arduino Starter Kits like

* or
*

To configure and run *thing-it-node*, install *nodejs* and *npm* on your computer. 

Then install **thing-it-node**:

`npm install thing-it-node`

in a directory _installDir_.

For our example above modify the file _installDir_/**configuration.js** as follows

`module.exports = {
	port : 3001,
	nodeConfigurationFile : "_installDir_/examples/simple-lighting/configuration.json"
};`

Start the thing-it-node from _installDir_ via

`node thing-it-node.js`

You will see something like

which means that your **thing-it-node** server has started properly, found its configuration but determined that your Arduino Board is not configured properly. Hence,

* connect your Arduino Board via USB,
* connect Relay R1 to Pin and Relay R2 to Pin.
* connect Button B1 to Pin and Button B2 to Pin.
* connect the LDR to Pin

Restart the **thing-it-node** server. The server output should now look like 



You should also be able switch both LEDs on and off via the respective buttons or by covering the LDR.

Finally, connect your browser to 

`http://localhost:3001/examples/simple-lighting/console.html`

Browser content should look like

# Taking it further
