var thingItNode = (function () {
    return {

        initializePluginDirectives: function (module) {
            module.directive('ngBlur', function () {
                return function (scope, elem, attrs) {
                    elem.bind('blur', function () {
                        scope.$apply(attrs.ngBlur);
                    });
                };
            });
            module.directive('tiTriState', function ($timeout, $parse) {
                return {
                    restrict: "E",
                    template: "<div class='triState'><input type='checkbox'/></div>",
                    link: function (scope, element, attrs) {
                        jQuery(element).find("input").click(function () {
                            var value = scope.$eval(attrs.tiModel);
                            var allowsIndeterminate = scope.$eval(attrs.tiAllowsIndeterminate);

                            if (value == null) {
                                jQuery(element).find("input").prop("checked", true);
                                jQuery(element).find("input").prop("indeterminate", false);

                                scope.$eval(attrs.tiModel + " = true");
                                scope.$eval(attrs.tiChange);
                            }
                            else if (value == true) {
                                jQuery(element).find("input").prop("checked", false);
                                jQuery(element).find("input").prop("indeterminate", false);

                                scope.$eval(attrs.tiModel + " = false");
                                scope.$eval(attrs.tiChange);
                            }
                            else if (value == false) {
                                if (allowsIndeterminate) {
                                    jQuery(element).find("input").prop("checked", true);
                                    jQuery(element).find("input").prop("indeterminate", true);

                                    scope.$eval(attrs.tiModel + " = null");
                                    scope.$eval(attrs.tiChange);
                                }
                                else {
                                    jQuery(element).find("input").prop("checked", true);
                                    jQuery(element).find("input").prop("indeterminate", false);

                                    scope.$eval(attrs.tiModel + " = true");
                                    scope.$eval(attrs.tiChange);
                                }
                            }
                        });

                        scope.$watch(attrs.tiModel, function (value) {
                            if (value == null) {
                                jQuery(element).find("input").prop("checked", false);
                                jQuery(element).find("input").prop("indeterminate", true);
                            }
                            else if (value == true) {
                                jQuery(element).find("input").prop("checked", true);
                                jQuery(element).find("input").prop("indeterminate", false);
                            }
                            else if (value == false) {
                                jQuery(element).find("input").prop("checked", false);
                                jQuery(element).find("input").prop("indeterminate", false);
                            }
                        });
                    }
                };
            });
            module.directive('tiAudio', function ($timeout, $parse) {
                return {
                    restrict: "E",
                    template: "<audio controls><source type='audio/wav'></audio>",
                    link: function (scope, element, attrs) {
                        scope.$watch(attrs.tiModel, function (value) {
                            jQuery(element).children("audio").children("source").attr("src", value);
                            jQuery(element).children("audio").load();
                        });
                    }
                };
            });
            module.directive('tiVideo', function ($timeout, $parse) {
                return {
                    restrict: "E",
                    template: "<video><source type='video/mp4' webkit-playsinline></video>",
                    //template: "<canvas width='320' height='180' style='border: 1px solid red;'></canvas>",
                    link: function (scope, element, attrs) {
                        //var transports;
                        //
                        //if ("WebSocket" in window && WebSocket.CLOSED > 2) {
                        //    transports: ['websocket', 'xhr-polling']
                        //} else {
                        //    transports: ['xhr-polling']
                        //}
                        //
                        //var rootUrl = window.location.protocol + "//"
                        //    + window.location.hostname + ":" + window.location.port;
                        //
                        //var ws = {OPEN: "OPEN"};
                        //
                        //var canvas = jQuery(element).children("canvas")[0];
                        //
                        //var ctx = canvas.getContext('2d');
                        //
                        //ctx.fillStyle = '#444';
                        //ctx.fillText('Loading...', canvas.width / 2 - 30, canvas.height / 3);
                        //
                        //// Setup the WebSocket connection and start the player
                        //
                        //var player = new jsmpeg(ws, {canvas: canvas});
                        //
                        //ws.onopen(ws);
                        //
                        //var namespaceName = rootUrl + scope.$eval(attrs.tiModel);
                        //
                        //console.log("Connecting: " + namespaceName);
                        //
                        //namespace = scope.io.connect(namespaceName, {
                        //    transports: transports
                        //});
                        //
                        //namespace.on("connection", function (socket) {
                        //    console.log("Data Stream connected");
                        //
                        //    ws.readyState = ws.OPEN;
                        //});
                        //namespace.on("disconnect", function (socket) {
                        //    console.log("Data Stream disconnected");
                        //});
                        //namespace.on("data", function (message) {
                        //    console.log("Data received");
                        //
                        //    ws.onmessage({data: message.raw});
                        //});

                        jQuery(element).children("video")[0].autoplay = true;

                        scope.$watch(attrs.tiModel, function (value) {
                            console.log(value);
                            jQuery(element).children("video").children("source").attr("src", value);
                            jQuery(element).children("video")[0].load();
                        });
                    }
                };
            });

            module.directive('tiKnob', function ($timeout, $parse) {
                return {
                    link: function (scope, element, attrs) {
                        var options = scope.$eval(attrs.tiKnob);

                        if (!options) {
                            options = {};
                        }

                        options.min = scope.$eval(attrs.tiMin);
                        options.max = scope.$eval(attrs.tiMax);
                        options.change = function (value) {
                            bufferedChange(scope, element,
                                value,
                                attrs.tiChange, 500);
                        }
                        options.release = function (value) {
                            scope.$eval(attrs.tiModel
                                + "=" + value);

                            if (attrs.tiChange) {
                                scope.$eval(attrs.tiChange);
                            }
                        }

                        jQuery(element).knob(options);

                        scope.$watch(attrs.tiModel, function (value) {
                            jQuery(element).val(value).trigger('change');
                        });
                    }
                };
            });
            module.directive('tiSlider', function ($timeout, $parse) {
                return {
                    link: function (scope, element, attrs) {
                        var options = scope.$eval(attrs.tiSlider);

                        if (!options) {
                            options = {};
                        }

                        jQuery(element).ionRangeSlider(
                            {
                                type: "single",
                                min: scope.$eval(attrs.tiMin),
                                max: scope.$eval(attrs.tiMax),
                                rangeClass: 'rangeslider',
                                fillClass: 'rangeslider__fill',
                                handleClass: 'rangeslider__handle',
                                onChange: function (value) {
                                    bufferedChange(scope, element,
                                        value.from,
                                        attrs.tiChange, 500);
                                },
                                onFinish: function (value) {
                                    scope.$eval(attrs.tiModel
                                        + "=" + value.from);

                                    if (attrs.tiChange) {
                                        scope.$eval(attrs.tiChange);
                                    }
                                }
                            });

                        scope.$watch(attrs.tiModel, function (value) {
                            jQuery(element).data("ionRangeSlider").update({
                                from: value
                            });
                        });
                    }
                };
            });
            module.directive('tiSwitch', function ($timeout, $parse) {
                return {
                    link: function (scope, element, attrs) {
                        var options = scope.$eval(attrs.tiSwitch);

                        if (!options) {
                            options = {};
                        }

                        jQuery(element).find("input")
                            .prop("checked", false);

                        jQuery(element).find("input").click(
                            function () {
                                var expression = attrs.tiModel
                                    + "="
                                    + jQuery(element).find("input")
                                        .prop("checked");
                                scope.$eval(expression);

                                if (attrs.tiChange) {
                                    console.log("Switch value change");

                                    scope.$eval(attrs.tiChange);
                                }
                            });

                        scope.$watch(attrs.tiModel, function (value) {
                            jQuery(element).find("input").prop("checked",
                                value);
                        });
                    }
                };
            });

            module.directive('tiBattery', function ($timeout, $parse) {
                return {
                    restrict: "E",
                    link: function (scope, element, attrs) {
                        var batteryLevel = jQuery("<div class='battery-level' style='height:100%;'>");
                        var battery = jQuery("<div class='battery'></div>");

                        battery.append(batteryLevel);
                        jQuery(element).append(battery);

                        scope.$watch(attrs.tiModel, function (value) {
                            if (value <= 10) {
                                batteryLevel.css({height: "10%"});
                                batteryLevel.removeClass("warn");
                                batteryLevel.addClass("alert");
                            } else if (value > 10 && value <= 18) {
                                batteryLevel.css({height: "18%"});
                                batteryLevel.removeClass("alert");
                                batteryLevel.addClass("warn");
                            } else if (value > 18 && value <= 25) {
                                batteryLevel.css({height: "25%"});
                                batteryLevel.removeClass("alert");
                                batteryLevel.removeClass("warn");
                            } else if (value > 25 && value <= 50) {
                                batteryLevel.css({height: "50%"});
                                batteryLevel.removeClass("alert");
                                batteryLevel.removeClass("warn");
                            } else if (value > 50 && value <= 75) {
                                batteryLevel.css({height: "75%"});
                                batteryLevel.removeClass("alert");
                                batteryLevel.removeClass("warn");
                            } else {
                                batteryLevel.css({height: "100%"});
                                batteryLevel.removeClass("alert");
                                batteryLevel.removeClass("warn");
                            }
                        });
                    }
                };
            });
            module.directive('tiDrone', function ($timeout, $parse) {
                return {
                    restrict: "E",
                    link: function (scope, element, attrs) {
                        var controlStick = jQuery("<span class='droneControlStick'><i class='fa fa-dot-circle-o'></i></span>");
                        var controlPanel = jQuery("<div class='droneControlPanel'></div>");

                        controlStick.draggable({
                            containment: "parent",
                            start: function (event) {
                                //jQuery(element).data();
                            }, stop: function (event) {
                                console.log("Last top: " + jQuery(controlStick).data("lastTop"));
                                console.log("New top : " + jQuery(controlStick).position().top);

                                var delta = -Math.round((((jQuery(controlStick).position().top - jQuery(controlStick).data("lastTop")) * 400 /* Replace with config for maxHeight*/ / controlPanel.height())) / 50);

                                jQuery(controlStick).data("lastTop", controlStick.position().top);

                                if (delta > 0) {
                                    console.log("Steps up: " + delta);
                                    scope.callDeviceService(scope.$eval(attrs.tiDevice), "up");
                                }
                                else {
                                    console.log("Steps down: " + (-delta));
                                    scope.callDeviceService(scope.$eval(attrs.tiDevice), "down");
                                }
                            }
                        });
                        controlPanel.append(controlStick);
                        jQuery(element).append(controlPanel);

                        controlStick.css({
                            left: 0.5 * controlPanel.width(),
                            top: controlPanel.height() - 40
                        });

                        jQuery(controlStick).data("lastTop", controlStick.position().top);

                        scope.$watch(attrs.tiHeight, function (value) {
                            console.log("height changed to " + value);

                            controlStick.css({
                                top: controlPanel.height() - 40 - controlPanel.height() * value / 400
                            });
                            jQuery(controlStick).data("lastTop", controlStick.position().top);
                        });
                    }
                };
            });
        }
    }

    /**
     * Does not write to the model! Could do if we would block watches during change.
     */
    function bufferedChange(scope, element, value, tiChange,
                            bufferLength) {
        if (new Date().getTime()
            - jQuery(element).data("lastChangeTimestamp") < bufferLength) {
        } else {
            jQuery(element).data("lastChangeTimestamp",
                new Date().getTime());

            // Apply the change and start next buffer interval

            if (tiChange) {
                scope.$eval(tiChange);
            }
        }
    }
}());

