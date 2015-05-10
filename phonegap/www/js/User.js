/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define(["js/Utils", "js/Entitlement"],
    function (Utils, Entitlement) {
        return {
            bind: function (node, user) {
                Utils.inheritMethods(user, new User());

                user.bind(node);

                return user;
            }

        };

        /**
         *
         * @constructor
         */
        function User() {
            User.prototype.bind = function (node) {
                for (var n in this.groupEntitlements) {
                    var group = node.getGroup(this.groupEntitlements[n].id);

                    this.groupEntitlements[n].__group = group;
                    group.__entitlement = this.groupEntitlements[n];

                    Entitlement.bindGroupEntitlement(group, this.groupEntitlements[n]);
                }
            };

            User.prototype.hasRole = function (role) {
                for (var n in this.roleEntitlements) {
                    if (this.roleEntitlements[n].id == role && this.roleEntitlements[n].granted == "true") {
                        return true;
                    }
                }

                return false;
            };
        }
    });