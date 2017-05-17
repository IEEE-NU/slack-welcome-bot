module.exports = {
    hello: "Hello!",
    code_location: "My code is available for all to see at github.com/ieeE-NU/slack-welcome-bot!",
    welcome: ["Welcome to the IEEE NU Slack! We're happy to have you. " +
        "You can use the #general channel to discuss whatever you want, CS-related or not.",
        "We recommend using meetfranz.com or the official Slack client so you can have this Slack open without taking up a precious browser tab. " +
        "Franz even lets you have Messenger, GroupMe, WhatsApp, and many other chat services in one handy client."].join('\n'),
    help: "No",
    unauthorized_admin: "Sorry, only admins can use commands (anything starting with a '>'). Admins can be added to the admins.js file in the slack-welcome-bot repo",
    invalid_path: "Invalid path for Firebase, cannot contain the characters: .$[]/",
    invalid_data: "Invalid data, must be valid JSON",
    unknown_command: "Sorry, I don't recognize that command",
    unknown_trigger: "Sorry, I'm not sure what you want"
}