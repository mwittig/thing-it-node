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

                return this;
            };

            /**
             *
             */
            Speech.prototype.listen = function () {
                console.log("listen");
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

                    this.understand(this.finalTranscript);
                }.bind(this);

                this.recognition.start();
            };

            /**
             *
             */
            Speech.prototype.respond = function (tokens) {
                if (tokens[0] === "hello") {
                    this.synthesis.speak(new SpeechSynthesisUtterance("hello i am thing it how can i help"));
                }
                else if (tokens[0] === "help") {
                    var utterance = "you have selected a node and have the devices";

                    for (var n in this.parent.node.devices) {
                        utterance += " ";
                        utterance += this.parent.node.devices[n].label;
                    }

                    this.synthesis.speak(new SpeechSynthesisUtterance(utterance));
                }
                else if (tokens[0] === "mesh") {
                    if (tokens.length == 1) {
                        this.synthesis.speak(new SpeechSynthesisUtterance("which mesh"));
                    }
                    else {
                        this.synthesis.speak(new SpeechSynthesisUtterance("Switching to mesh " + tokens[1]));
                    }
                }
                else if (tokens[0] === "node") {
                    this.synthesis.speak(new SpeechSynthesisUtterance("which node"));
                }
                else if (tokens[0] === "device") {
                    if (tokens.length == 1) {
                        this.synthesis.speak(new SpeechSynthesisUtterance("which device"));
                    }
                    else if (tokens.length == 2) {
                        this.synthesis.speak(new SpeechSynthesisUtterance("what to do with device " + tokens[1]));
                    }
                    else {
                        try {
                            var device = this.parent.node.getDeviceByLabel(tokens[1]);

                            this.synthesis.speak(new SpeechSynthesisUtterance("invoking " + tokens[2] + " on " + tokens[1]));

                            this.parent.callDeviceService(device, tokens[2]);
                        }
                        catch (error) {
                            console.error(error);

                            this.synthesis.speak(new SpeechSynthesisUtterance(error));
                        }
                    }
                }
                else if (tokens[0] === "stop") {
                    this.synthesis.speak(new SpeechSynthesisUtterance("good bye"));

                    this.listening = false;

                    this.parent.safeApply();

                    return;
                }
                else {
                    this.synthesis.speak(new SpeechSynthesisUtterance("i dont understand " + tokens));
                }

                this.listen();
            };

            /**
             *
             */
            Speech.prototype.understand = function (tokens) {
                console.log("Tokens: " + tokens);

                var tokens = tokens.split(" ");

                console.log("Tokens: ", tokens);

                // TODO Replace by self-learning

                for (var n in tokens) {
                    tokens[n] = tokens[n].toLowerCase();

                    if (tokens[n] === "help") {
                        tokens[n] = "help";
                    }
                    else if (tokens[n] === "mash" || tokens[n] === "mesh") {
                        tokens[n] = "mesh";
                    }
                    else if (tokens[n] === "note" || tokens[n] === "node" || tokens[n] === "not") {
                        tokens[n] = "node";
                    }
                    else if (tokens[n] === "divine" || tokens[n] === "divide") {
                        tokens[n] = "device";
                    }
                }

                this.respond(tokens);
            };

            /**
             *
             */
            Speech.prototype.hold = function (token) {
                this.recognition.abort();

                this.listening = false;
            };
        }
    });