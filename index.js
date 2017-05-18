// Load environment variables from .env file
require('dotenv').config();

const slackEventsApi = require('@slack/events-api');
const SlackClient = require('@slack/client').WebClient;
const passport = require('passport');
const SlackStrategy = require('@aoberoi/passport-slack').default.Strategy;
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');

const firebase = require("firebase");
// User IDs who are allowed to change messages
let admins = require("./admins");
// Text of messages to send users
let messages = require("./messages");
let triggers = require("./triggers");

// Only using this bot on one Slack team, so only need to track one Slack client
let slackClient;

// Initialize firebase
firebase.initializeApp({
  apiKey: "AIzaSyA2TxWYA6G9afrM_Xk2743KGj7LYG1ymH4",
  authDomain: "ieee-slack.firebaseapp.com",
  databaseURL: "https://ieee-slack.firebaseio.com",
  projectId: "ieee-slack",
  storageBucket: "ieee-slack.appspot.com",
  messagingSenderId: "503109759610"
});

// Authenticate with firebase
firebase.auth().signInWithEmailAndPassword(process.env.FIREBASE_EMAIL, process.env.FIREBASE_PASSWORD).catch(error => {
  console.log(`Firebase: auth error ${error.code}: ${error.message}`);
}).then(() => {
  console.log("Firebase: Logged in!");
  // Watch for changes to messages
  firebase.database().ref('/messages').on('value', snapshot => {
    console.log("Firebase: messages updated");
    messages = Object.assign(messages, snapshot.val());
  });
  // Watch for changes to admins
  firebase.database().ref('/admins').on('value', snapshot => {
    console.log("Firebase: admins updated");
    admins = Object.assign(admins, snapshot.val());
  });
});

// Initialize an Express application
const app = express();
app.use(bodyParser.json());

// Initialize Add to Slack (OAuth) helpers
passport.use(new SlackStrategy({
  clientID: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  skipUserProfile: true,
}, (accessToken, scopes, team, extra, profiles, done) => {
  console.log(`authorized on team ${team.id}`);
  slackClient = new SlackClient(extra.bot.accessToken);
  done(null, {});
}));

// Plug the Add to Slack (OAuth) helpers into the express app
app.use(passport.initialize());
app.get('/', (req, res) => {
  res.send('<a href="/auth/slack"><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>');
});
app.get('/auth/slack', passport.authenticate('slack', {
  scope: ['bot']
}));
app.get('/auth/slack/callback',
  passport.authenticate('slack', { session: false }),
  (req, res) => {
    console.log(`WelcomeBot installed`);
    res.send('<p>WelcomeBot was successfully installed on your team.</p>');
  },
  (err, req, res, next) => {
    res.status(500).send(`<p>WelcomeBot failed to install</p> <pre>${err}</pre>`);
  }
);

// *** Initialize event adapter using verification token from environment variables ***
const slackEvents = slackEventsApi.createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN);
app.use('/slack/events', slackEvents.expressMiddleware());

slackEvents.on('message', event => {
  // Only respond to direct messages sent to us, not our own messages
  if (event.subtype) return;
  slackClient.dm.open(event.user, (err, res) => {
    // Only respond to messages sent directly to us, not to other users
    // Our bot can listen to all direct messages
    if (res.channel.id !== event.channel) return;
    console.log(`receive message ${event.text}`);

    if (event.text[0] === "!") {
      // Admin command
      processCommand(event);
      return;
    }

    let parsedTrigger = event.text
      .toLowerCase()
      .replace(/[^\w\s]|_/g, "");;
    if (parsedTrigger in triggers) {
      sendMessage(event.user, messages[triggers[parsedTrigger]]);
      return;
    }

    sendMessage(event.user, messages.unknown_trigger);
  });
});

function processCommand(event) {
  // Not authorized for a command
  if (!admins.hasOwnProperty(event.user)) {
    console.log("Unauthorized command");
    sendMessage(event.user, messages.unauthorized_admin);
    return;
  }

  let splitText = event.text.split(" ");
  const command = splitText.shift()
    .substring(1)
    .toLowerCase()
    .replace(/[^\w\s]|_/g, "");
  if (command === "set" || command === "update") {
    const path = splitText.shift();
    // Make sure the path is a valid Firebase path
    if (path.match(/\.\$\[]#/i)) {
      sendMessage(event.user, messages.invalid_path);
      return;
    }

    let data;
    try {
      data = JSON.parse(splitText.join(" "));
    } catch (error) {
      // JSON parse failed, probably
      sendMessage(event.user, messages.invalid_data);
      return;
    }
    firebase.database().ref(path)[command](data);
    sendMessage(event.user, `${path} ${command}: ${JSON.stringify(data)}`);
  } else if (command === "set_welcome") {
    let data = splitText.join(" ");
    firebase.database().ref("messages").update({ welcome: data });
    sendMessage(event.user, `set welcome message to: ${data}`);
  } else if (command === "get") {
    sendMessage(event.user, `messages: ${JSON.stringify(messages, null, 2)}`);
  } else {
    sendMessage(event.user, messages.unknown_command);
  }
}

slackEvents.on('team_join', event => {
  console.log("new user");
  sendMessage(event.user.id, messages.welcome);
});

function sendMessage(user_id, message) {
  console.log(`Sending message to ${user_id}`);
  // Initialize a client
  // Handle initialization failure
  if (!slackClient) {
    return console.error('No authorization found for this team. Did you install this app again after restarting?');
  }
  // Lookup or open a new direct message channel to the user
  slackClient.dm.open(user_id, (err, res) => {
    if (err) {
      console.log("Error finding user to send message");
      return;
    }
    // Send them a nice message!
    let parsedMessage = message.replace("<user>", `<@${user_id}>`);
    slackClient.chat.postMessage(res.channel.id, parsedMessage, { link_names: 1 }).catch(console.error);
  });
}

// *** Handle errors ***
slackEvents.on('error', (error) => {
  if (error.code === slackEventsApi.errorCodes.TOKEN_VERIFICATION_FAILURE) {
    // This error type also has a `body` propery containing the request body which failed verification.
    console.error(`An unverified request was sent to the Slack events Request URL. Request body: \
${JSON.stringify(error.body)}`);
  } else {
    console.error(`An error occurred while handling a Slack event: ${error.message}`);
  }
});

// Start the express application
const port = process.env.PORT || 3000;
http.createServer(app).listen(port, () => {
  console.log(`server listening on port ${port}`);
});
