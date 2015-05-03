/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define(["js/Utils"],
    function (Utils) {
        return {
            create: function (node) {
                var entitlements = [];

                for (var n in node.groups) {
                    entitlements.push(createEntitlementForGroup(node.groups[n]));
                }

                return entitlements;
            }
        };

        /**
         *
         */
        function Entitlements() {

            /**
             *
             */
            Entitlements.prototype.bla = function () {
            };
        }

        function createEntitlementForGroup(group) {
            var entitlement = {
                type: "group",
                label: group.label,
                subGroups: []
            };

            for (var n in group.subGroups[n]) {
                entitlement.subGroups.push(createEntitlementForGroup(group.subGroups[n]));
            }

            return entitlement;
        }
    });