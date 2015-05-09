/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define(["js/Utils"],
    function (Utils) {
        return {
            bindGroupEntitlement : function(group, entitlement) {
                Utils.inheritMethods(entitlement, new Entitlement());

                entitlement.bindGroupEntitlement(group);

                return entitlement;
            }

        };

        /**
         * The Entitlement class allows to display and modify Entitlements as well as evaluate them against
         * Groups, Devices, Actors and Sensors.
         *
         * @constructor
         */
        function Entitlement()
        {
            /**
             *
             */
            Entitlement.prototype.bindGroupEntitlement = function (group) {
                for (var n in this.groupEntitlements)
                {
                    Utils.inheritMethods(this.groupEntitlements[n], new Entitlement());

                    var subGroup = group.getSubGroup(this.groupEntitlements[n].id);

                    this.groupEntitlements[n].__superGroupEntitlement = this;
                    this.groupEntitlements[n].__group = subGroup;
                    subGroup.__entitlement = this.groupEntitlements[n];

                    this.groupEntitlements[n].bindGroupEntitlement(subGroup);
                }
            };

            /**
             *
             * @returns {*}
             */
            Entitlement.prototype.viewGranted = function () {
                if (this.view != null)
                {
                    return this.view;
                }
                else if (this.__superGroupEntitlement)
                {
                    return this.__superGroupEntitlement.viewGranted();
                }

                return false;
            };

            /**
             *
             * @returns {*}
             */
            Entitlement.prototype.executeGranted = function () {
                if (this.view != null)
                {
                    return this.execute;
                }
                else if (this.__superGroupEntitlement)
                {
                    return this.__superGroupEntitlement.executeGranted();
                }

                return false;
            };

            /**
             *
             * @returns {*}
             */
            Entitlement.prototype.allowedViewInherited = function () {
                if (this.__superGroup)
                {
                    return this.__superGroup.topGroup().view;
                }
                else
                {
                    return null;
                }
            };

            /**
             *
             * @returns {*}
             */
            Entitlement.prototype.allowedExecuteInherited = function () {
                if (this.__superGroup)
                {
                    return this.__superGroup.topGroup().execute;
                }
                else
                {
                    return null;
                }
            };

            /**
             *
             * @returns {*}
             */
            Entitlement.prototype.topGroup = function () {
                if (this.__superGroup)
                {
                    return this.__superGroup.topGroup();
                }
                else
                {
                    return this;
                }
            };
        }
    });