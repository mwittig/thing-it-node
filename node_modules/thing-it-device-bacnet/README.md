# thing-it-device-bacnet

[![NPM](https://nodei.co/npm/thing-it-device-bacnet.png)](https://nodei.co/npm/thing-it-device-bacnet/)
[![NPM](https://nodei.co/npm-dl/thing-it-device-bacnet.png)](https://nodei.co/npm/thing-it-device-bacnet/)

[thing-it-node] Device Plugin for BACnet networks to control BACnet devices.

This allows you to 

* control BACnet devices over the Internet,
* define complex scenes, storyboards and timer controlled execution 

by means of [thing-it-node](https://github.com/marcgille/thing-it-node) and [thing-it.com](http://www.thing-it.com).

Hereby, this plugin represents basic BACnet Objects such as

* **Analog Input**
* **Analog Value**
* **Binary Input**
* **Binary Value**

connected to a generic **BACnet Device** and communication to those via UDP/IP.

Those who are interested in imlementing a specific, non-generic BACnet Device e.g. a thermostat with specific state, services and UI from a [thing-it-node] perspective
can still use the **BacNetAdapter** class under **lib** in this package to easily implement communication with the BACnet network via IP/UDP.

NOTE: This Device Plugin is in an early development stage.

## Installation

### Installation of NodeJS and [thing-it-node]

First, install [nodejs](https://nodejs.org/en/download/) on your computer (e.g. your PC or your Raspberry Pi).

Then install **[thing-it-node]** via

```
npm install -g thing-it-node
```

### Connectivity to BACnet

Make sure that the computer running **[thing-it-node]** is connected to the network where your BACnet Devices and Objects can be reachned via IP and obtain
the BACnet IDs for the Devices and Objects you want to represent in **[thing-it-node]**.

### Initialization and Start of [thing-it-node] 

The **[thing-it-device-bacnet]** Plugin is installed with **[thing-it-node]**, hence there is no need to install it separately.

The Plugin supports Autodiscovery, hence you only have to create a directory in which you intend to run the configuration, e.g.
 
```
mkdir ~/bacnet-test
cd ~/bacnet-test
```

and invoke

```
tin init
```

and then start **[thing-it-node]** via

```
tin run
```

Install the **thing-it Mobile App** from the Apple Appstore or Google Play and set it up to connect to **[thing-it-node]** 
locally as described [here](https://thing-it.com/thing-it/#/documentationPanel/mobileClient/connectionModes) or just connect your browser under 
[http://localhost:3001](http://localhost:3001).

## Mobile UI

The following screenshot shows the Node Page of the [sample configuration]("./examples.configuration"):

<p align="center"><a href="./documentation/images/mobile-ui.png"><img src="./documentation/images/mobile-ui.png" width="70%" height="70%"></a></p>

## Where to go from here ...

After completing the above, you may be interested in

* Configuring additional [Devices](https://www.thing-it.com/thing-it/#/documentationPanel/mobileClient/deviceConfiguration), 
[Groups](https://www.thing-it.com/thing-it/#/documentationPanel/mobileClient/groupConfiguration), 
[Services](https://www.thing-it.com/thing-it/#/documentationPanel/mobileClient/serviceConfiguration), 
[Event Processing](https://www.thing-it.com/thing-it/#/documentationPanel/mobileClient/eventConfiguration), 
[Storyboards](https://www.thing-it.com/thing-it/#/documentationPanel/mobileClient/storyboardConfiguration) and 
[Jobs](https://www.thing-it.com/thing-it/#/documentationPanel/mobileClient/jobConfiguration) via your **[thing-it] Mobile App**.
* Use [thing-it.com](https://www.thing-it.com) to safely connect your Node Box from everywhere, manage complex configurations, store and analyze historical data 
and offer your configurations to others on the **[thing-it] Mesh Market**.
* Explore other Device Plugins like [Texas Instruments Sensor Tag](https://www.npmjs.com/package/thing-it-device-ti-sensortag), [Plugwise Smart Switches](https://www.npmjs.com/package/thing-it-device-plugwise) and many more. For a full set of 
Device Plugins search for **thing-it-device** on [npm](https://www.npmjs.com/). Or [write your own Plugins](https://github.com/marcgille/thing-it-node/wiki/Plugin-Development-Concepts).
