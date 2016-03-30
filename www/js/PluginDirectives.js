angular.module("ThingItMobile.PluginDirectives", [])
    .filter('unsafe', function ($sce) {
        return function (value) {
            return $sce.trustAsHtml(value);
        };
    })
    .filter('characters', function () {
        return function (input, chars, breakOnWord) {
            if (isNaN(chars)) return input;
            if (chars <= 0) return '';
            if (input && input.length > chars) {
                input = input.substring(0, chars);

                if (!breakOnWord) {
                    var lastspace = input.lastIndexOf(' ');
                    //get last space
                    if (lastspace !== -1) {
                        input = input.substr(0, lastspace);
                    }
                } else {
                    while (input.charAt(input.length - 1) === ' ') {
                        input = input.substr(0, input.length - 1);
                    }
                }
                return input + '…';
            }
            return input;
        };
    })
    .filter('splitcharacters', function () {
        return function (input, chars) {
            if (isNaN(chars)) return input;
            if (chars <= 0) return '';
            if (input && input.length > chars) {
                var prefix = input.substring(0, chars / 2);
                var postfix = input.substring(input.length - chars / 2, input.length);
                return prefix + '...' + postfix;
            }
            return input;
        };
    })
    .filter('words', function () {
        return function (input, words) {
            if (isNaN(words)) return input;
            if (words <= 0) return '';
            if (input) {
                var inputWords = input.split(/\s+/);
                if (inputWords.length > words) {
                    input = inputWords.slice(0, words).join(' ') + '…';
                }
            }
            return input;
        };
    })
    .filter('duration', function () {
        return function (millseconds) {
            var seconds = Math.floor(millseconds / 1000);
            var h = 3600;
            var m = 60;
            var hours = Math.floor(seconds / h);
            var minutes = Math.floor((seconds % h) / m);
            var seconds = Math.floor((seconds % m));
            var timeString = '';

            if (seconds < 10) seconds = "0" + seconds;
            if (hours < 10) hours = "0" + hours;
            if (minutes < 10) minutes = "0" + minutes;

            timeString = hours + ":" + minutes + ":" + seconds;

            return timeString;
        }
    })
    .filter('yesno', function () {
        return function (value) {
            if (value) {
                return "Yes";
            } else {
                return "No";
            }
        }
    })
    .directive('ngBlur', function () {
        return function (scope, elem, attrs) {
            elem.bind('blur', function () {
                scope.$apply(attrs.ngBlur);
            });
        };
    })
    .directive('tiCheckbox', function ($timeout, $parse) {
        return {
            restrict: "A",
            link: function (scope, element, attrs) {
                jQuery(element).click(function () {
                    if ($(this).is(':checked')) {
                        scope.$eval(attrs.ngModel + " = true");
                    } else {
                        scope.$eval(attrs.ngModel + " = false");
                    }
                });

                scope.$watch(attrs.ngModel, function (value) {
                    jQuery(element).prop("checked", value);
                });
            }
        };
    })
    .directive('tiTriState', function ($timeout, $parse) {
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
    })
    .directive('tiAudio', function () {
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
    })
    .directive('tiVideo', function () {
        return {
            restrict: "E",
            template: "<img><br><video><source type='video/mp4' webkit-playsinline><source type='application/x-mpegURL’></video>",
            link: function (scope, element, attrs) {
                var video = jQuery(element).children("video");
                var img = jQuery(element).children("img");

                video.css("display", "none");
                img.css("width", "100%");
                img.css("display", "inline-block");
                img.addClass("snapshotImage");

                img.click(function () {
                    img.css("display", "none");
                    video.css("display", "inline-block");
                    video.css("width", "100%");

                    video[0].autoplay = true;

                    video[0].play();
                });

                video.bind("abort", function () {
                    video.css("display", "none");
                    img.css("display", "inline-block");
                }.bind(this));

                video.bind("ended", function () {
                    video.css("display", "none");
                    img.css("display", "inline-block");
                }.bind(this));

                scope.$watch(attrs.tiVideoStream, function (value) {
                    if (value.indexOf(".cgi") > 0) {
                        video.css("display", "none");
                        img.css("display", "inline-block");
                        img.attr("src", value);
                    } else {
                        jQuery(element).children("video").children("source").attr("src", value);
                    }
                });

                scope.$watch(attrs.tiSnapshotImage, function (value) {
                    img.attr("src", value);
                });
            }
        };
    })
    .directive('tiKnob', function ($timeout, $parse) {
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
                };
                options.release = function (value) {
                    scope.$eval(attrs.tiModel
                        + "=" + value);

                    if (attrs.tiChange) {
                        scope.$eval(attrs.tiChange);
                    }
                };

                jQuery(element).knob(options);

                scope.$watch(attrs.tiModel, function (value) {
                    jQuery(element).val(value).trigger('change');
                });
            }
        };
    })
    .directive('tiSlider', function ($timeout, $parse) {
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
    })
    .directive('tiSwitch', function ($timeout, $parse) {
        return {
            restrict: "E",
            template: /*"<div class='onoffswitch'>" +
             "<input type='checkbox' class='onoffswitch-checkbox' checked><label class='onoffswitch-label'>" +
             "<span class='onoffswitch-inner'></span> <span class='onoffswitch-switch'></span></label></div>",*/
                "<div style='display: inline-block;'><input class='tiToggle tiToggleRoundFlat' type='checkbox'><label></label></div>",
            link: function (scope, element, attrs) {
                var label = jQuery(element).find("label");
                var checkbox = jQuery(element).find("input");

                checkbox.uniqueId();
                label.attr("for", checkbox.attr("id"));

                if (!scope.$eval(attrs.ngDisabled)) {
                    label.click(function () {
                        checkbox.prop("checked", !checkbox.prop("checked"));

                        var expression = attrs.tiModel
                            + "="
                            + checkbox
                                .prop("checked");
                        scope.$eval(expression);

                        if (attrs.tiChange) {
                            scope.$eval(attrs.tiChange);
                        }
                    });
                }

                scope.$watch(attrs.tiModel, function (value) {
                    checkbox.prop("checked",
                        value);
                });
            }
        };
    })
    .directive('tiBattery', function ($timeout, $parse) {
        return {
            restrict: "E",
            link: function (scope, element, attrs) {
                var icon = jQuery("<i></i>");

                jQuery(element).append(icon);
                jQuery(element).addClass("battery");

                scope.$watch(attrs.tiModel, function (value) {
                    if (value <= 10) {
                        icon.attr("class", "icon sl-battery-low alertColor")
                    } else if (value > 10 && value <= 25) {
                        icon.attr("class", "icon sl-battery-medium warningColor")
                    } else if (value > 25 && value <= 50) {
                        icon.attr("class", "icon sl-battery-medium okColor")
                    } else if (value > 50 && value <= 75) {
                        icon.attr("class", "icon sl-battery-high okColor")
                    } else {
                        icon.attr("class", "icon sl-battery-full okColor")
                    }
                });
            }
        };
    })
    .directive('tiDrone', function ($timeout, $parse) {
        return {
            restrict: "E",
            link: function (scope, element, attrs) {
                var controlStick = jQuery("<span class='droneControlStick'><i class='fa fa-dot-circle-o'></i></span>");
                var controlPanel = jQuery("<div class='droneControlPanel'></div>");

                controlStick.draggable({
                    containment: "parent",
                    start: function (event) {
                        event.stopPropagation();
                        //jQuery(element).data();
                    }, drag: function (event) {
                        event.stopPropagation();
                    }, stop: function (event) {
                        event.stopPropagation();
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
    })
    .directive('tiColorPicker', function ($timeout, $parse) {
        return {
            restrict: "E",
            template: "<div style='width: 30px; height: 30px; border: 1px solid #999999;'><i></i></div>",
            link: function (scope, element, attrs) {
                var div = jQuery(element).find("div");
                var options = scope.$eval(attrs.tiOptions);

                options = options ? options : {};
                options.component = div;

                if (attrs.style) {
                    var styles = attrs.style.split(";");
                    for (var n in styles) {
                        if (styles[n].trim().length) {
                            var style = styles[n].split(":");
                            div.css(style[0].trim(), style[1].trim());
                        }
                    }
                }

                div.css("display", "inline-block");
                div.spectrum({
                    showButtons: false,
                    containerClassName: "colorPicker",
                    change: function (color) {
                        scope.$eval(attrs.ngModel + "='" + color.toHexString() + "'");
                        div.css(
                            "background-color", color.toHexString()); // TODO Redunant?

                        if (attrs.ngChange) {
                            scope.$eval(attrs.ngChange);
                        }
                    }
                });

                scope.$watch(attrs.ngModel, function (value) {
                    div.css(
                        "background-color", value);
                    div.spectrum("set", value);
                });
            }
        };
    })
    .directive('tiColorBar', function ($timeout, $parse) {
        return {
            restrict: "E",
            template: "<div class='colorBar' style='display: table;'</div>",
            link: function (scope, element, attrs) {
                var div = jQuery(element).find("div");
                var colors = ["lightPrimary",
                    "lighterPrimary",
                    "lightestPrimary", "secondary",
                    "lightSecondary",
                    "lighterSecondary",
                    "lightestSecondary", "ternary",
                    "lightTernary",
                    "lighterTernary",
                    "lightestTernary", "contrast",
                    "lightContrast",
                    "lighterContrast",
                    "lightestContrast"]
                var totalWidth = 0;

                while (totalWidth < 100) {
                    var color = colors[Math.floor(Math.random() * colors.length)];
                    var width = Math.floor(Math.random() * 12) + 1;

                    if (totalWidth + width > 100) {
                        width = 100 - totalWidth;
                    }

                    div.append("<div class='" + color + "BackgroundColor' style='display: table-cell; width: "
                        + width + "%;'>");

                    totalWidth += width;
                }
            }
        }
    }).directive('tiIconOrPhoto', function ($timeout, $parse) {
    return {
        restrict: "E",
        template: "<img class='photo' style='width: auto; height: 2em;'><span><i></i></span>",
        link: function (scope, element, attrs) {
            var img = jQuery(element).find("img");
            var span = jQuery(element).find("span");
            var i = jQuery(element).find("i");
            var mobileConsole = scope.$eval(attrs.tiMobileConsole);
            var defaultIcon = scope.$eval(attrs.tiDefaultIcon);

            scope.$watch(attrs.ngModel, function (element) {
                if (element.photoUri) {
                    img.show();
                    span.hide();
                    img.prop("src", mobileConsole.consoleService.getFilePath(mobileConsole.node, element.photoUri));
                }
                else {
                    img.hide();
                    span.show();

                    if (element.icon) {
                        i.addClass(element.icon);
                    }
                    else {
                        i.addClass(defaultIcon);
                    }
                }
            });
        }
    };
}).directive('tiClickOverlay', function ($timeout, $parse) {
    return {
        restrict: "A",
        link: function (scope, element, attrs) {
            jQuery(element).addClass("center-overlay");

            var i = jQuery("<i class='fa fa-bullseye overlay-icon'></i>");

            jQuery(element).click(function () {
                i.addClass("pulseAnimation");

                window.setTimeout(function () {
                    i.removeClass("pulseAnimation");
                }, 2000);
            });

            jQuery(element).append(i);
        }
    };
}).directive('tiMotionSensor', function ($timeout, $parse) {
    return {
        restrict: "E",
        template: "<div style='display: table-row; height: 2em; vertical-align: middle'><div style='display: table-cell; width: 100%; text-align: center'><i class='icon sl-contacts-1 overlay-alarm-icon' style='display: inline-block:'></i><span class='smallFont lightPrimaryColor'>No Motion detected.</span></div></div>",
        link: function (scope, element, attrs) {
            var i = jQuery(element).find("i");
            var span = jQuery(element).find("span");

            scope.$watch(attrs.ngModel, function (value) {
                if (value) {
                    i.css("display", "inline-block");
                    span.css("display", "none");
                    i.addClass("infinitePulseAnimation");
                } else {
                    i.removeClass("infinitePulseAnimation");
                    i.css("display", "none");
                    span.css("display", "inline-block");
                }
            });
        }
    };
}).directive('tiSmokeDetector', function ($timeout, $parse) {
    return {
        restrict: "E",
        template: "<div style='display: table-row; height: 2em; vertical-align: middle'><div style='display: table-cell; width: 2em;  height: 2em; text-align: center'><i class='noSmoke icon sl-smiley-happy-1 okColor' style='font-size: 2em;'></i><i class='smoke fa fa-bullseye overlay-alarm-icon' style='display: inline-block:'></i></div></div>",
        link: function (scope, element, attrs) {
            var noSmokeIcon = jQuery(element).find(".noSmoke");
            var smokeIcon = jQuery(element).find(".smoke");

            scope.$watch(attrs.ngModel, function (value) {
                if (value > scope.$eval(attrs.tiThreshold)) {
                    noSmokeIcon.css("display", "none");
                    smokeIcon.css("display", "inline-block");
                    smokeIcon.addClass("infinitePulseAnimation");
                } else {
                    noSmokeIcon.css("display", "inline-block");
                    smokeIcon.css("display", "none");
                    smokeIcon.removeClass("infinitePulseAnimation");
                }
            });
        }
    };
});

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