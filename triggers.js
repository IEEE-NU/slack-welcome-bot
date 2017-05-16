module.exports = {
    welcome: ["welcome message"],
    hello: ["hello", "hi", "hey", "sup"],
    inverted: function () {
        // Invert the triggers
        let inverse = {};
        for (const key in this) {
            if (key === "inverted") {
                continue;
            }

            for (let i = 0, l = this[key].length; i < l; i++) {
                inverse[this[key][i]] = key;
            }
        }
        return inverse;
    }
}