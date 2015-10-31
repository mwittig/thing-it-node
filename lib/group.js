module.exports = {
    bind: function (node, group, superGroup) {
        utils.inheritMethods(group, new Group());

        group.bind(node, superGroup);

        return group;
    }
};

var q = require('q');
var utils = require("./utils");

/**
 *
 */
function Group() {
    /**
     *
     * @param node
     * @param superGroup
     */
    Group.prototype.bind = function (node, superGroup) {
        this.__node = node;

        if (superGroup) {
            this.__superGroup = superGroup;
        }

        for (var n in this.subGroups) {
            utils.inheritMethods(this.subGroups[n], new Group());

            this.subGroups[n].bind(node, this);
        }
    };

    /**
     *
     * @returns {{id: *, label: *, subGroups: Array}}
     */
    Group.prototype.clientCopy = function () {
        var group = {
            id: this.id,
            label: this.label,
            icon: this.icon,
            photoUrl: this.photoUrl,
            devices: [],
            actors: [],
            sensors: [],
            services: [],
            subGroups: []
        };

        for (var n in this.devices) {
            group.devices.push(this.devices[n]);
        }

        for (var n in this.actors) {
            group.actors.push(this.actors[n]);
        }

        for (var n in this.sensors) {
            group.sensors.push(this.sensors[n]);
        }

        for (var n in this.services) {
            group.services.push(this.services[n]);
        }

        for (var n in this.subGroups) {
            group.subGroups.push(this.subGroups[n].clientCopy());
        }

        return group;
    };
}