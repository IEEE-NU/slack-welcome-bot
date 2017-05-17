let triggers = {
    welcome: ["welcome message"],
    hello: ["hello", "hi", "hey", "sup"],
    code_location: ["show me your code", "code"],
    help: ["help", "wat"]
}

// Invert the triggers
let inverse = {};
for (const key in triggers) {
    for (let i = 0, l = triggers[key].length; i < l; i++) {
        inverse[triggers[key][i]] = key;
    }
}

module.exports = inverse;