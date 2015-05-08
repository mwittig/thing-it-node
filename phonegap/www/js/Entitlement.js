/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define(["js/Utils"],
    function (Utils) {
        return {
            bind : function(entitlement) {
                Utils.inheritMethods(entitlement, new Entitlement());

                entitlement.bind();

                return entitlement;
            }

        };

        /**
         *
         * @constructor
         */
        function Entitlement()
        {
            /**
             *
             */
            Entitlement.prototype.bind = function () {
                for (var n in this.subGroups)
                {
                    Utils.inheritMethods(this.subGroups[n], new Entitlement());

                    this.subGroups[n].__superGroup = this;

                    this.subGroups[n].bind();
                }
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