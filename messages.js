let messages = {
    hello: "Hello, <user>!",
    code_location: "My code is available for all to see at github.com/IEEE-NU/slack-welcome-bot!",
    welcome: ["Welcome to the IEEE NU Slack, <user>! We're happy to have you. " +
        "You can use the #general channel to discuss whatever you want, CS-related or not.",
        "We recommend using <meetfranz.com|Franz> or the <slack.com/get|official Slack client> so you can have this Slack open without taking up a precious browser tab. " +
        "Franz even lets you have Messenger, GroupMe, WhatsApp, and many other chat services in one handy client.",
        "If you've never use Slack before, reply *intro* for a quick overview. To see what else I respond to, message back *help*"].join('\n\n'),
    intro: "Slack is a messaging client for organizations. You can chat in channels, which are chat rooms dedicated to a topic (like #memes), or directly message people or groups of people.",
    help: ["I respond to the following commands:",
        "*intro*: I'll give you an overview of Slack",
        "*code*: get a link to my source code",
        "*hello, hi, or hey*: I'll say hello back :)",
        "*welcome message*: replay the original welcome message",
        "*help*: I'll send this message again"].join('\n\n'),
    unauthorized_admin: "Sorry, only admins can use commands (anything starting with a '>'). Admins can be added to the admins.js file in the slack-welcome-bot repo",
    invalid_path: "Invalid path for Firebase, cannot contain the characters: .$[]/",
    invalid_data: "Invalid data, must be valid JSON",
    unknown_command: "Sorry, I don't recognize that command",
    unknown_trigger: "Sorry, I'm not sure what you want"
}
module.exports = messages;