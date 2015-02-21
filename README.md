**[thing-it-node]** allows you to 

* connect multiple devices like an Arduino Uno with Actors and Sensors or a Bluetooth-enabled Wristband to your node computer (e.g. a regular server, a Raspberry Pi or a BeagleBone Black) to centralize **Internet access** to a **distributed, scalable set of Sensors and Actors**, 
* invoke **REST Services** on all Actors, 
* receive **WebSocket Notifications** on all Sensor data changes and events,
* define **Higher-level REST Services** to control multiple Actors,
* define **Complex Event Processing** to react on Sensor events and data changes,
* define **Storyboards** for the timeline-based, animation of Actor State Changes (e.g. for robotics),
* define **Jobs** for calendar-based, recurring execution of Services or Storyboards,
* define **Complex Data Variables** to persistently store Event Data for later evaluation and
* use a **Mobile Client** to control your devices.

All of the above is controlled by a [nodejs](http://nodejs.org/) server which is bootstrapped from a **simple JSON configuration**, which allows you to configure a **home automation system in minutes**.

<p align="center"><a href="./documentation/images/architecture.png"><img src="./documentation/images/architecture.png" width="80%" height="80%"></a></p>

More details can be found on the ([thing-it-node] Wiki)[https://github.com/marcgille/thing-it-node/wiki].

# thing-it.com

You can use [www.thing-it.com](http://www.thing-it.com) to create and simulate your setup for **[thing-it-node]** and then just download the configuration file.

# Dual License

**[thing-it-node]** is available under the [MIT License](./thing-it-node/license.mit) and the [Eclipse Public License](https://eclipse.org/org/documents/epl-v10.html).

# Philosophy

**[thing-it-node]** is created because we felt the need for a scalable management entity which bridges Internet services and multiple, possibly heterogenous devices. It is not intended to compete with, but rather complement and use great libraries and frameworks like

* [Fritzing](http://fritzing.org/) by FH Potsdam,
* [Johnny Five](https://github.com/rwaldron/johnny-five/wiki/Board) by Rick Waldron or
* [aREST](https://github.com/marcoschwartz/aREST) by Marco Schwarz.

# Getting Started

## The Scenario

Let's set up a simple - but not too simple - home automation scenario:

1. Two LEDs representing e.g. two lamps (you could actually immediately replace the LEDs by two relays to switch lamps on and off).
1. A Photocell to detect the ambient light in a room and event processing to switch both LEDs on if the light goes below some threshold for a while (to distinguish sunset from the Photocell being temporarily covered by your curious cat).
1. Two buttons to toggle the state of each lamp.
1. A simple (mobile capable) web application to toggle the state of both lamps individually and together - alternatively to using the buttons - and to display the event under 2.

## Installing, Configuring and Running [thing-it-node]

To install, configure and run  **[thing-it-node]**, first install

* [Python](https://www.python.org/downloads/)

and then
	
* [nodejs](http://nodejs.org/download/)
 
on your computer (e.g. your PC or your Raspberry Pi). 

Then install **[thing-it-node]**:

```
mkdir -p <installDir>/node_modules
npm install --prefix <installDir> thing-it-node
```

which will install **[thing-it-node]** in the directory **_&lt;installDir&gt;_/node_modules**.

The options file **_&lt;installDir&gt;_/node_modules/options.js** is already configured as

```javascript
nodeConfigurationFile : "./examples/simple-lighting/configuration.json"
```

so that the **[thing-it-node]** server will be booted against the Configuration File for our simple lighting scenario.

If you are interested, have a look at the [configuration file](./thing-it-node/examples/simple-lighting/configuration.json) - the content should be self-explanatory.

Probably the most interesting part is the definition of the Photocell 

```javascript
{
       "id": "photocell1",
       "label": "Photocell 1",
       "type": "photocell",
       "configuration": {
       "pin": "A0",
       "rate": 2000
       }
}
```

and the Event Processing for the same

```javascript
{
       "id": "eventProcessor3",
       "label": "Event Processor 3",
       "observables": ["arduino1.photocell1"],
       "window" : {"duration": 10000},
       "match" : "minimum(arduino1.photocell1.series) < 700 && deviation(arduino1.photocell1.series) < 100 && arduino1.photocell1.series.length > 1",
       "script": "arduino1.led1.on(); arduino1.led2.on();"
}
```

which ensures that the setup only reacts to a slow, consistent reduction of the ambient light.

Start the **[thing-it-node]** from **_&lt;installDir&gt;_/node_modules** via

`node thing-it-node.js`

You will see something like

    ---------------------------------------------------------------------------
     [thing-it-node] at http://0.0.0.0:3001


     Node Configuration File: /Users/marcgille/git/thing-it-node/thing-it-node/examples/simple-lighting/configuration.json
     Simulated              : true
     Hot Deployment         : false
     Verify Call Signature  : true
     Public Key File        : /Users/marcgille/git/thing-it-node/thing-it-node/examples/simple-lighting/cert.pem
     Signing Algorithm      : sha256


     Copyright (c) 2014-2015 Marc Gille. All rights reserved.
    -----------------------------------------------------------------------------


    Loading plugin [arduino].
    Starting Node [Home].
    Actor [LED1] started.
		    Actor [LED2] started.
		    Sensor [Button 1] started.
		    Sensor [Button 2] started.
		    Sensor [Photocell 1] started.
	    Device [Arduino Uno 1] started.
	    Event Processor [Event Processor 1] listening.
	    Event Processor [Event Processor 2] listening.
	    Event Processor [Event Processor 3] listening.
	    Service [toggleAll] available.
    Node [Home] started.  

which means that your **[thing-it-node]** server found its configuration and has been started properly. It is not doing anything because the option **simulated** is set to **true** in the options file **_&lt;installDir&gt;_/options.js**. You could already use the **[thing-it-node]** Mobile Client against the simulated configuration (which you definitely would do on a new configuration), but for now we want the real thing.

Stop the **[thing-it-node]** Server with **CTRL-C** and change its value to

```javascript
simulated : false
```

to prepare **[thing-it-node]** to talk to a real device - which we still have to set up.

## Setting up Device, Actors and Sensors

To setup your Device you need the following hardware

* an Arduino Uno board (e.g. [http://www.adafruit.com/product/50](http://www.adafruit.com/product/50)),
* two LEDs (e.g. [https://www.sparkfun.com/products/9590](https://www.sparkfun.com/products/9590)),
* a Photocell (e.g. [http://www.adafruit.com/product/161](http://www.adafruit.com/product/161)),
* two buttons (e.g.),
* possibly a breadboard (e.g. [http://www.adafruit.com/product/64](http://www.adafruit.com/product/64)) and 
* possibly some jumper wires (e.g. [http://www.adafruit.com/product/758](http://www.adafruit.com/product/758)).

All of the above is also available with Arduino Starter Kits like

* the [Arduino Starter Kit](http://www.amazon.com/Arduino-Starter-Official-170-page-Projects/dp/B009UKZV0A/ref=sr_1_1?s=electronics&ie=UTF8&qid=1420481357&sr=1-1&keywords=arduino+starter+kit) or 
* the [Sparkfun Inventor's Kit]() or
* the [Fritzing Creator Kit](http://shop.fritzing.org/en/a-136/).

To get the Arduino Uno connected

* download and install the Arduino IDE
* plug in your Arduino or Arduino compatible microcontroller via USB,
* open the Arduino IDE, select: *File &raquo; Examples &raquo; Firmata &raquo; StandardFirmata*,
* click *Upload*.

If the upload was successful, the board is now prepared. Now,

* connect your Arduino Board via USB,
* connect the LEDs to Pin 12 and 13.
* connect the Buttons to Pin 2 and 4.
* connect the Photocell to Pin A0.

e.g. like

![wiring](./examples/simple-lighting/wiring.png)

Restart the **thing-it-node** server. The output should now look like 

    ---------------------------------------------------------------------------
     [thing-it-node] at http://0.0.0.0:3001


     Node Configuration File: /Users/marcgille/git/thing-it-node/thing-it-node/examples/simple-lighting/configuration.json
     Simulated              : false
     Hot Deployment         : false
     Verify Call Signature  : true
     Public Key File        : /Users/marcgille/git/thing-it-node/thing-it-node/examples/simple-lighting/cert.pem
     Signing Algorithm      : sha256


     Copyright (c) 2014-2015 Marc Gille. All rights reserved.
    -----------------------------------------------------------------------------


    Loading plugin [arduino].
    Starting Node [Home].
    1422043614997 Device(s) /dev/cu.usbmodem1411 
    1422043618304 Connected /dev/cu.usbmodem1411 
    1422043618305 Repl Initialized 
    >> 	Starting Device [Arduino Uno 1]
 		    Actor [LED1] started.
		    Actor [LED2] started.
		    Sensor [Button 1] started.
		    Sensor [Button 2] started.
		    Sensor [Photocell 1] started.
	    Device [Arduino Uno 1] started.
	    Event Processor [Event Processor 1] listening.
	    Event Processor [Event Processor 2] listening.
	    Event Processor [Event Processor 3] listening.
	    Service [toggleAll] available.
    Node [Home] started.

You should also be able switch both LEDs on and off via the respective buttons or switch both LEDs on by covering the Photocell for more than a few seconds.

## Running the Mobile Web App

Connect your browser to 

`http://localhost:3001/mobile/console.html`

You will see a Login Screen. _You can leave *Account* and *Password* empty for now. We will be adding security measures later._

Click Login. The browser content should look like

<p align="center"><a href="./documentation/images/mobile-client.png"><img src="./documentation/images/mobile-client.png" width="40%" height="40%"></a></p>

If you have remote (e.g. Wifi) access to the computer running the **[thing-it-node]**, you may also use a mobile device (e.g. an iPhone or iPad) to connect to your simple lighting system.

## Summary

Let us recap what we did:

With

* a simple configuration file,
* the corresponding wiring of the Arduino 

but **no programming** we were able to create a simple but realistic home automation scenario.

## Using thing-it.com

If you still find the creation of the configuration file too technical (we agree ...) - you may consider to use the free services of [www.thing-it.com](http://www.thing-it.com) to create and simulate your setup and then just download the configuration file.

The Simple Lighting solution presented here is available as a Mesh under

[http://www.thing-it.com/thing-it/index.html?offer=54d417205a538cc81b0d31c9#/meshOfferPanel](http://www.thing-it.com/thing-it/index.html?offer=54d417205a538cc81b0d31c9#/meshOfferPanel)

You can find other Meshes in the [thing-it] [Mesh Market](http://www.thing-it.com/thing-it/index.html#/searchPanel) for free simulation and download.

To create your own solutions on [www.thing-it.com](http://www.thing-it.com) you would define **Nodes** and **Devices**

<img src="./documentation/images/thing-it-node-configuration.png" style="">

put **Actors**, **Sensors**, **Services** and **Event Processors** together,

<img src="./documentation/images/thing-it-switchboard.png" style="">

edit the logic of **Event Processors**

<img src="./documentation/images/thing-it-event-processor.png" style="">

and **Services** and then simulate and test the configuration before you download it to your **[thing-it-node]** deployment.

Consider the [[thing-it] Documentation](http://www.thing-it.com/thing-it/index.html#/documentationPanel) to configure the scenario described above.

# Taking it further

If you have the **Getting Started** example running, you may want to

* understand the concepts of *[thing-it-node]* better
* have a look at further examples e.g.
    * [Color Changes for an RGB LED with Potentiometers](https://github.com/marcgille/thing-it-node/wiki/RGB-LED-Example)
    * [Animation of RGB LED Color Changes using a Storyboard](https://github.com/marcgille/thing-it-node/wiki/RGB-LED-Color-Changing-Storyboard)
    * [Recurring Service Execution with Jobs](https://github.com/marcgille/thing-it-node/wiki/Recurring-Service-Execution-with-Jobs)
* [connect your [thing-it-node] to the Internet](https://github.com/marcgille/thing-it-node/wiki/Connecting-%5Bthing-it-node%5D-to-the-Internet)
* [apply security measures for your [thing-it-node]](https://github.com/marcgille/thing-it-node/wiki/Using-Signature-and-Encryption-for-REST-Services-and-Web-Socket-Messages)
