define(
    ["js/Utils"],
    function (Utils) {
        return {
            initialize: function (parent) {
                return new Speech().initialize(parent);
            }
        };

        /**
         *
         */
        function Speech() {
            /**
             *
             */
            Speech.prototype.initialize = function (parent) {
                this.listening = false;
                this.parent = parent;

                this.contexts = {
                    "Global": {
                        productions: [{
                            name: "Hello",
                            sequence: [{
                                token: "hello",
                                reaction: function () {
                                    this.utter("hello i am thing it, how can i help");
                                }.bind(this)
                            }]
                        }, {
                            name: "Help",
                            sequence: [{
                                token: "help",
                                action: function () {
                                    this.utter("no help in the global context");
                                }.bind(this)
                            }]
                        }]
                    },
                    "Node": {
                        productions: [{
                            name: "Hello",
                            sequence: [{
                                token: "hello",
                                action: function () {
                                    this.utter("hello i am thing it how can i help");
                                }.bind(this)
                            }]
                        }, {
                            name: "Help",
                            sequence: [{
                                token: "help",
                                synophones: ["held"],
                                action: function () {
                                    this.utter("you have selected a node");
                                }.bind(this)
                            }]
                        }, {
                            name: "Group Navigation",
                            sequence: [{
                                class: "Group",
                                action: function (objects, object) {
                                    this.utter("switching context to group " + object.label);
                                }.bind(this)
                            }]
                        }, {
                            name: "Node Service Call",
                            sequence: [{
                                class: "Service",
                                action: function (objects, object) {
                                    this.utter("invoking service " + object.label);
                                }.bind(this)
                            }]
                        }, {
                            name: "Device Service Call",
                            sequence: [{
                                class: "Device", action: function (objects, object) {
                                    objects.device = object;
                                }.bind(this)
                            }, {
                                class: "Service", action: function (objects, object) {
                                    try {
                                        this.utter("invoking " + object.label + " on " + objects.device.label);

                                        this.parent.callDeviceService(objects.device, object.id);
                                    }
                                    catch (error) {
                                        console.error(error);

                                        this.utter(error);
                                    }
                                }.bind(this)
                            }]
                        }]
                    }, "Group": {
                        productions: [{
                            name: "Back Navigation",
                            sequence: [{
                                token: "back",
                                action: function () {
                                    this.utter("back to node");
                                }.bind(this)
                            }]
                        }]
                    }
                }

                return this;
            };

            /**
             *
             */
            Speech.prototype.listen = function () {
                console.log("listen");

                this.context = this.contexts["Node"]
                this.listening = true;
                this.recognition = new webkitSpeechRecognition();
                this.synthesis = window.speechSynthesis;

                //this.recognition.continuous = true;
                //this.recognition.lang

                this.finalTranscript = "";

                this.recognition.onstart = function () {
                }.bind(this);

                this.recognition.onerror = function (error) {
                    this.listening = false;

                    this.parent.safeApply();

                }.bind(this);

                this.recognition.onend = function () {
                    this.listening = false;

                    this.parent.safeApply();
                }.bind(this);

                this.recognition.onsoundend = function () {
                }.bind(this);

                this.recognition.onresult = function (event) {
                    var interimTranscript = "";

                    for (var i = event.resultIndex; i < event.results.length; ++i) {
                        console.log(event.results[i][0].transcript);

                        if (event.results[i].isFinal) {
                            this.finalTranscript += event.results[i][0].transcript;
                        } else {
                            interimTranscript += event.results[i][0].transcript;
                        }
                    }

                    console.log(this.finalTranscript);

                    this.respond(this.finalTranscript);
                }.bind(this);

                this.recognition.start();
            };

            /**
             *
             */
            Speech.prototype.utter = function (utterance) {
                this.synthesis.speak(new SpeechSynthesisUtterance(utterance));
            };

            /**
             *
             */
            Speech.prototype.respond = function (tokens) {
                var originalTokens = tokens;
                tokens = tokens.split(" ");

                for (var n in tokens) {
                    tokens[n] = tokens[n].toLowerCase();
                }

                var currentContextObject = this.parent.node;
                var objects = {};

                for (var n in this.context.productions) {
                    var production = this.context.productions[n];

                    console.log("Check production " + production.name);

                    //if (tokens.length != production.sequence.length) {
                    //    console.log("Length do not match.");
                    //    continue;
                    //}

                    for (var m = 0; m < production.sequence.length; ++m) {
                        var step = production.sequence[m];

                        console.log("\t Step " + m);

                        if (step.token && !this.matchToken(tokens[m], step)) {
                            console.log("Token " + tokens[m] + " does match.");

                            break;
                        }
                        else if (step.class) {
                            // Check maximum of 3 concatenated tokens as object labels
                            // TODO Could check till the end of sequence

                            var label = "";
                            var newContextObject = null;

                            for (var l = m; l < tokens.length; ++l) {
                                if (l > 0) {
                                    label += " ";
                                }

                                label += tokens[m + l];

                                console.log("Trying label [" + label + "]");

                                newContextObject = this.matchObject(label, step, currentContextObject);

                                if (newContextObject) {
                                    break;
                                }

                                console.log("No context object.");
                            }

                            if (!newContextObject) {
                                console.log("No context object found.");

                                break;
                            }

                            currentContextObject = newContextObject;

                            console.log("Current Context Object", currentContextObject);
                        }

                        if (step.action) {
                            step.action(objects, currentContextObject);
                        }

                        if (m == production.sequence.length - 1) {
                            console.log("Production completed");

                            this.listen();

                            return;
                        }
                    }
                }

                this.utter("I do not understand " + originalTokens);
                this.listen();
            };

            /**
             *
             */
            Speech.prototype.matchToken = function (token, tokenStep) {
                if (token == tokenStep.token) {
                    return true;
                }

                if (tokenStep.synophones) {
                    for (var n in tokenStep.synophones[n]) {
                        if (token == tokenStep.synophones[n]) {
                            return true;
                        }
                    }
                }

                return false;
            };

            /**
             *
             */
            Speech.prototype.matchObject = function (token, objectStep, contextObject) {
                var subContextObject = contextObject.getContextObject(token);

                console.log("Expected Class " + objectStep.class);

                if (subContextObject) {
                    console.log("Actual Class " + subContextObject.class);
                }

                if (subContextObject && subContextObject.class == objectStep.class) {
                    return subContextObject;
                }

                return null;
            };

            /**
             *
             */
            Speech.prototype.hold = function (token) {
                this.recognition.abort();

                this.listening = false;
            };
        }
    }
)
;