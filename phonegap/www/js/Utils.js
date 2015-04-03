define([], function () {
    return {
        inherit: inherit,
        inheritMethods: inheritMethods,
        formatDateTime: formatDateTime,
        getTimeDifferenceInMinutes: getTimeDifferenceInMinutes,
        removeItemFromArray: function (array, item) {
            removeItemFromArray(array, item);
        },
        formatMoneyAmount: formatMoneyAmount,
        formatDecimal: formatDecimal,
        getHash: getHash,
        getQueryParameters: getQueryParameters,
        installPostMessageListener: installPostMessageListener,
        updatePageURL: updatePageURL,
        composeUrl: composeUrl,
        cloneFiltered: cloneFiltered,
        ajax: ajax,
    };

    /**
     *
     */
    function inherit(target, source) {
        jQuery.extend(target, source);
        inheritMethods(target, source);

        return target;
    }

    /**
     * Auxiliary method to copy all methods from the parentObject to the
     * childObject.
     */
    function inheritMethods(target, source) {
        for (var member in source) {
            if (source[member] instanceof Function) {
                target[member] = source[member];
            }
        }
    }

    /**
     *
     */
    function formatDateTime(dateTime) {
        if (!dateTime) {
            return "-";
        }

        dateTime = new Date(dateTime);

        return pad(dateTime.getUTCDate(), 2) + "."
            + pad(dateTime.getUTCMonth() + 1, 2) + "."
            + dateTime.getUTCFullYear() + " "
            + pad(dateTime.getUTCHours(), 2) + ":"
            + pad(dateTime.getUTCMinutes(), 2);
    }

    /**
     *
     */
    function pad(number, characters) {
        return (1e15 + number + // combine with large number
        "" // convert to string
        ).slice(-characters); // cut leading "1"
    }

    /**
     *
     * @param startTime
     * @param endTime
     * @returns
     */
    function getTimeDifferenceInMinutes(startTime, endTime) {
        var remainingTime = endTime - startTime;

        var minutes = remainingTime / 1000 / 60;
        var fraction = minutes % 1;

        return Math.round(minutes - fraction);
    }

    /**
     *
     * @param item
     */
    function removeItemFromArray(array, item) {
        var n = 0;
        while (n < array.length) {
            if (array[n] == item) {
                removeFromArray(array, n, n);
                // incase duplicates are present array size decreases,
                // so again checking with same index position
                continue;
            }
            ++n;
        }
    }

    function removeFromArray(array, from, to) {
        var rest = array.slice((to || from) + 1 || array.length);
        array.length = from < 0 ? array.length + from : from;
        return array.push.apply(array, rest);
    }

    /**
     * TODO Consider using existing library (e.g. google).
     */
    function formatMoneyAmount(amount, currency) {
        if (!amount) {
            amount = 0.0;
        }

        var decimalSeparator = new Number("1.2").toLocaleString().substr(1, 1);

        var amountWithCommas = amount.toLocaleString();
        var arParts = String(amountWithCommas).split(decimalSeparator);
        var intPart = arParts[0];
        var decPart = (arParts.length > 1 ? arParts[1] : '');
        decPart = (decPart + '00').substr(0, 2);

        return currency + " " + intPart + decimalSeparator + decPart;
    }

    /**
     * TODO Consider using existing library (e.g. google).
     */
    function formatDecimal(amount) {
        if (!amount) {
            return "-";
        }

        var decimalSeparator = new Number("1.2").toLocaleString().substr(1, 1);

        var amountWithCommas = amount.toLocaleString();
        var arParts = String(amountWithCommas).split(decimalSeparator);
        var intPart = arParts[0];
        var decPart = (arParts.length > 1 ? arParts[1] : '');
        decPart = (decPart + '00').substr(0, 2);

        return intPart + decimalSeparator + decPart;
    }

    /**
     *
     */
    function getHash() {
        var hash = window.location.hash;

        if (hash.indexOf("#/") == 0) {
            hash = hash.substring(2);
        } else if (hash.indexOf("#") == 0) {
            hash = hash.substring(1);
        }

        if (hash.indexOf("?") > 0) {
            hash = hash.substring(0, hash.indexOf("?"));
        }

        return hash;
    }

    /**
     *
     */
    function getQueryParameters() {
        var parameters = [];

        if (window.location.hash != null) {
            console.log(window.location.hash);

            var keyValues = window.location.hash.slice(
                window.location.hash.indexOf('?') + 1).split('&');

            console.log(keyValues);

            for (var i = 0; i < keyValues.length; i++) {
                var keyValue = keyValues[i].split('=');

                parameters[keyValue[0]] = keyValue[1];
            }
        }

        return parameters;
    }

    function updatePageURL() {
        if (window.location.search.indexOf('?') > -1) {
            var currentUrl = window.location.href;
            var baseUrl = currentUrl.substring(0, currentUrl.indexOf('?'));
            var viewId = currentUrl.substring(currentUrl.indexOf("#"),
                currentUrl.length);
            var newUrl = baseUrl + viewId;
            // update the url without reloading page
            if (window.history.pushState) {
                window.history.pushState({}, window.document.title, newUrl);
            }
        }
    }

    /**
     *
     */
    function installPostMessageListener(win, handler) {
        var ret = {};
        try {
            if (win.postMessage) {
                if (win.addEventListener) {
                    win.addEventListener("message", handler, true);
                } else if (win.attachEvent) {
                    win.attachEvent("onmessage", handler);
                } else {
                    ret.errorCode = "NOT_SUPPORTED";
                }
            } else {
                ret.errorCode = "NOT_SUPPORTED";
            }
        } catch (e) {
            ret.errorCode = "FAILED";
            ret.errorMsg = e.message;
        }

        return ret;
    }

    /**
     *
     * @param hash
     * @param parameters
     * @returns
     */
    function composeUrl(path, parameters, hash) {
        var url = path;
        var first = true;

        for (var key in parameters) {
            if (first) {
                first = false;

                url += "?";
            } else {
                url += "&";
            }

            url += key;
            url += "=";
            url += parameters[key];
        }

        if (hash != null) {
            url += "#";
            url += hash;
        }

        return url;
    }

    /**
     *
     */
    function cloneFiltered(object, filter) {
        var clone = _.cloneDeep(object);

        // Traverse and delete all filtered
        // Check whether strip can be done in lodash callback

        stripFields(clone, filter);

        return clone;
    }

    function stripFields(object, filter) {
        if (typeof (object) !== "object") {
            return;
        }

        for (var key in object) {
            if (!object.hasOwnProperty(key)) {
                continue;
            }

            if (key.search(filter) == 0) {
                delete object[key];

                continue;
            }

            stripFields(object[key], filter);
        }
    }

    /**
     *
     */
    function ajax(url, method, contentType, data, headers) {
        var deferred = jQuery.Deferred();

        jQuery.ajax({
            url: url,
            type: method,
            contentType: contentType,
            data: data,
            beforeSend: function (request) {
                for (var key in headers) {
                    request.setRequestHeader(key, value);
                }
            },
        }).done(function (data, status, xhr) {
            console.log(method + ":" + url);
            console.log("SUCCESS:");
            console.log(data);

            deferred.resolve(data);
        }).fail(function (data) {
            console.log(method + ":" + url);
            console.log("FAILED:");
            console.log(data);

            deferred.reject(data.responseText);
        });

        return deferred.promise();
    }

    /**
     *
     */
    function getNextIdIndex(list, baseId, index) {
        for (var n = 0; n < list.length; ++n) {
            if (list[n].id == baseId + index) {
                return getNextIdIndex(list, baseId, ++index);
            }
        }

        return index;
    }
});