var ConfigurationManager = require("../lib/configurationManager");

var configurationManager = ConfigurationManager.create(process.cwd() + '/tmp', process.cwd() + '/tmp');

configurationManager.listen();
