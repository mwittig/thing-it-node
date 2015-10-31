var utils = require("./lib/utils");


var x = {a: "12",
         b: 12,
         c: [{a: 12, b: "12"}],
         d: {a: 77}};

x.__cylic = x;

clone = utils.cloneDeep([x]);

x.d.a = 9999999;

console.log(clone);

