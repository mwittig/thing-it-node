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

        if (superGroup)
        {
            this.__superGroup = superGroup;
        }

        for (var n in this.subGroups)
        {
            this.subGroups[n].bind(node, this);
        }
    };

    /**
     *
     * @returns {{id: *, label: *, subGroups: Array}}
     */
    Group.prototype.clientCopy = function () {
        var group =  {
            id: this.id,
            label: this.label,
            devices: this.devices,
            actors: this.actors,
            sensors: this.sensors,
            services: this.services,
            subGroups: []
        };

        for (var n in this.subGroups)
        {
            group.subGroups.push(this.subGroups[n].clientCopy());
        }

        return group;
    };
}