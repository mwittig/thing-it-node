/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define(["js/Utils", "js/Entitlement"],
    function (Utils, Entitlement) {
        return {
            bind : function(user) {
                Utils.inheritMethods(user, new User());

                user.bind();

                return user;
            }

        };

        /**
         *
         * @constructor
         */
        function User()
        {
            User.prototype.bind = function () {
                for (var n in this.entitlements)
                {
                    Entitlement.bind(this.entitlements[n]);
                }
            };
        }
    });