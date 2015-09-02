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
                this.active = false;
                this.parent = parent;

                return this;
            };

            /**
             *
             */
            Speech.prototype.setContext = function (context) {
                this.context = context;
            };

            /**
             *
             */
            Speech.prototype.activate = function () {
                this.active = true;

                this.listen();
            };

            /**
             *
             */
            Speech.prototype.deactivate = function () {
                this.recognition.abort();

                this.active = false;
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

                for (var l in tokens) {
                    tokens[l] = tokens[l].toLowerCase();
                }

                console.log("tokens", tokens);

                var candidateProduction;
                var candidateProductionTokens;

                for (var n in this.context.productions) {
                    var productionTokens = this.context.productions[n].tokens.split(" ");

                    for (var l in productionTokens) {
                        productionTokens[l] = productionTokens[l].toLowerCase();
                    }

                    console.log("Check production " + this.context.productions[n].name);
                    console.log("Production Tokens", productionTokens);

                    if (tokens.length != productionTokens.length) {
                        console.log("Length does not match.");
                        continue;
                    }

                    var match = true;

                    for (var m in tokens) {
                        if (!this.matchToken(tokens[m], productionTokens[m])) {
                            console.log("Token " + tokens[m] + " and " + productionTokens[m] + " does not match.");

                            match = false;

                            break;
                        }

                    }

                    if (match && (!candidateProductionTokens || productionTokens.length > candidateProductionTokens.length)) {

                        candidateProduction = this.context.productions[n];
                        candidateProductionTokens = productionTokens;
                    }
                }

                if (candidateProduction)
                {
                    console.log("Matching production", candidateProduction);
                    candidateProduction.action();
                }
                else
                {
                    console.log("No match found");

                    this.utter("I do not understand " + originalTokens);
                }

                this.listen();
            };

            /**
             *
             */
            Speech.prototype.matchToken = function (token, productionToken) {
                if (token == productionToken) {
                    return true;
                }

                //if (tokenStep.synophones) {
                //    for (var n in tokenStep.synophones[n]) {
                //        if (token == tokenStep.synophones[n]) {
                //            return true;
                //        }
                //    }
                //}

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
        }
    }
);