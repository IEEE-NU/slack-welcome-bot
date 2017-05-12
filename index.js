// Load environment variables from .env file
require('dotenv').config();

const slackEventsApi = require('@slack/events-api');
const SlackClient = require('@slack/client').WebClient;
const passport = require('passport');
const SlackStrategy = require('@aoberoi/passport-slack').default.Strategy;
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');

// *** Initialize event adapter using verification token from environment variables ***
const slackEvents = slackEventsApi.createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN, {
  includeBody: true
});

// We're only using this on one Slack team
let slackClient;
let accessToken;

// Initialize Add to Slack (OAuth) helpers
passport.use(new SlackStrategy({
  clientID: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  skipUserProfile: true,
}, (accessToken, scopes, team, extra, profiles, done) => {
  console.log(`authorized on team ${team.id}`);
  accessToken = extra.bot.accessToken;
  slackClient = new SlackClient(accessToken);
  done(null, {});
}));

// Initialize an Express application
const app = express();
app.use(bodyParser.json());

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
    console.log(`installed on team`);
    res.send('<p>WelcomeBot was successfully installed on your team.</p>');
  },
  (err, req, res, next) => {
    res.status(500).send(`<p>WelcomeBot failed to install</p> <pre>${err}</pre>`);
  }
);

// *** Plug the event adapter into the express app as middleware ***
app.use('/slack/events', slackEvents.expressMiddleware());

slackEvents.on('message', (message, body) => {
  if (message.subtype) return;
  console.log(`receive message ${message.text}`);
  sendWelcomeMessage(message.user);
});

slackEvents.on('team_join', (event, body) => {
  console.log("new user");
  sendWelcomeMessage(event.user.id);
});

function sendWelcomeMessage(user_id) {
  console.log(`Sending welcome message to ${user_id}`);
  // Initialize a client
  // Handle initialization failure
  if (!slackClient) {
    return console.error('No authorization found for this team. Did you install this app again after restarting?');
  }
  // Lookup or open a new direct message channel to the user
  slackClient.dm.open(user_id, (err, res) => {
    if (err) {
      console.log("Error finding user to send welcome message");
      return;
    }
    // Send them a nice message!
    slackClient.chat.postMessage(res.channel.id, `Hello <@${user_id}>! :tada:`)
      .catch(console.error);
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
