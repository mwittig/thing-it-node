define(
    ["js/Utils"],
    function (Utils) {
        return {
            initialize: initialize
        };

        function initialize(module) {
            module.directive('ngBlur', function () {
                return function (scope, elem, attrs) {
                    elem.bind('blur', function () {
                        scope.$apply(attrs.ngBlur);
                    });
                };
            });
            module.directive("jqmLi", function () {
                return function ($scope, element) {
                    $(element).hide();
                    setTimeout(function () {
                        $scope.$on('$viewContentLoaded', element.parent()
                            .listview('refresh'));
                    }, 500);
                    $(element).show();
                }
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
                    template: "<video><source type='video/mp4'></video>",
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
                            var expression = attrs.tiModel + "=" + value;
                            scope.$eval(expression);

                            if (attrs.tiChange) {
                                bufferedChange(scope, element, value,
                                    attrs.tiChange, 500);
                            }
                        }
                        options.release = function (value) {
                            var expression = attrs.tiModel + "=" + value;

                            scope.$eval(expression);

                            if (attrs.tiChange) {
                                bufferedChange(scope, element, value,
                                    attrs.tiChange, 500);
                            }
                        }

                        jQuery(element).knob(options);
                        jQuery(element).data("lastChangeTimestamp",
                            new Date().getTime());

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
                                    var expression = attrs.tiModel
                                        + "=" + value.from;
                                    scope.$eval(expression);

                                    if (attrs.tiChange) {
                                        bufferedChange(scope, element,
                                            value.from,
                                            attrs.tiChange, 500);
                                    }
                                },
                                onFinish: function (value) {
                                    var expression = attrs.tiModel
                                        + "=" + value.from;

                                    scope.$eval(expression);

                                    if (attrs.tiChange) {
                                        bufferedChange(scope, element,
                                            value.from,
                                            attrs.tiChange, 500);
                                    }
                                }
                            });
                        jQuery(element).data("lastChangeTimestamp",
                            new Date().getTime());

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

        /**
         *
         */
        function bufferedChange(scope, element, value, tiChange,
                                bufferLength) {
            if (new Date().getTime()
                - jQuery(element).data("lastChangeTimestamp") < bufferLength) {
                console.log("" + new Date() + ": Overwrite buffered value "
                + value);
            } else {
                // Apply the change and start next buffer interval

                console.log("" + new Date()
                + ": Execute immediate change with " + value);
                jQuery(element).data("lastChangeTimestamp",
                    new Date().getTime());
                scope.$eval(tiChange);

                window.setTimeout(function () {
                    // Values are cached in the model

                    console.log("" + new Date() + ": Delayed execution");
                    scope.$eval(tiChange);
                }, bufferLength);
            }
        }
    });
