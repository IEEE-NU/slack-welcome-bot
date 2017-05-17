// Value: the phrases that trigger a set respons
// Key: the key of the message (in messages.js) to send in response
let triggers = {
    intro: ["intro", "introduction"],
    welcome: ["welcome message"],
    hello: ["hello", "hi", "hey", "sup"],
    code_location: ["show me your code", "code"],
    help: ["help", "wat"]
}

// Invert the triggers
// Keys are now phrases
// Values are now the key of the message to respond with
let inverse = {};
for (const key in triggers) {
    for (let i = 0, l = triggers[key].length; i < l; i++) {
        inverse[triggers[key][i]] = key;
    }
}

module.exports = inverse;