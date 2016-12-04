# thing-it-weather

[![NPM](https://nodei.co/npm/thing-it-device-weather.png)](https://nodei.co/npm/thing-it-device-temperature-alert/)
[![NPM](https://nodei.co/npm-dl/thing-it-device-weather.png)](https://nodei.co/npm/thing-it-device-temperature-alert/)

Device Plugins for [[thing-it-node]](https://github.com/marcgille/thing-it-node) and [thing-it.com](wwww.thing-it.com) for weather via the (http://openweathermap.org) weather service.

## Configuration

Simply configure the following parameters via [thing-it] Mobile or [thing-it.com](wwww.thing-it.com).
* Open Weather Map Key: They key you get after registering at (http://openweathermap.org).
* ZIP: The ZIP code of the city you want to get weather for.
* Country Code: The country code (such as us, de) for the country the city is in.
* Language Code: The language code (en, de) for the result.
* Units: Either metric or imperial
* Update Frequency Seconds: Time in seconds until [thing-it] requests the next weather update. This should typically be
more than 10 minutes, so a value of 600 or higher.

## User Interface


## Where to go from here ...

After completing the above, you may be interested in

* Connecting additional [Devices](https://www.thing-it.com/thing-it/#/documentationPanel/mobileClient/deviceConfiguration) and configuring
[Groups](https://www.thing-it.com/thing-it/#/documentationPanel/mobileClient/groupConfiguration), 
[Services](https://www.thing-it.com/thing-it/#/documentationPanel/mobileClient/serviceConfiguration), 
[Event Processing](https://www.thing-it.com/thing-it/#/documentationPanel/mobileClient/eventConfiguration), 
[Storyboards](https://www.thing-it.com/thing-it/#/documentationPanel/mobileClient/storyboardConfiguration) and 
[Jobs](https://www.thing-it.com/thing-it/#/documentationPanel/mobileClient/jobConfiguration) via your **[thing-it] Mobile App**.
* Use [thing-it.com](https://www.thing-it.com) to safely connect your Node Box from everywhere, manage complex configurations, store and analyze historical data 
and offer your configurations to others on the **[thing-it] Mesh Market**.
* Explore other Device Plugins like [Texas Instruments Sensor Tag](https://www.npmjs.com/package/thing-it-device-ti-sensortag), [Philips Hue Lighting](https://www.npmjs.com/package/thing-it-device-philips-hue) and many more. For a full set of 
Device Plugins search for **thing-it-device** on [npm](https://www.npmjs.com/). Or [write your own Plugins](https://github.com/marcgille/thing-it-node/wiki/Plugin-Development-Concepts).