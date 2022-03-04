const request = require('request');
const core = require('@actions/core');
const github = require('@actions/github');

/**
 * Makes the actual API request to Slack
 * @param {object} body 
 * @param {string} token 
 */
function postMessage(body, token) {
  // Configure API request
  const options = {
    method: 'POST',
    url: 'https://slack.com/api/chat.postMessage',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body),
  };
  // Make request
  request(options, (error, response) => {
    if (error) throw new Error(error);
    // Read API response
    const body = JSON.parse(response.body);
    if (!body.ok) {
      throw new Error(response.body.error);
    }
  });
}

/**
 * Maps GitHub username to Slack member ID
 * @param {string} username 
 * @returns 
 */
function getSlackID(username) {
  switch (username.toLowerCase()) {
    case 'eschirtz': return "UGSRY8DLK"
    case 'jmswaney': return "UGSEAAD3M"
    case 'matt-samply': return "U02BSR8MJ11"
    case 'guitarpro1186': return "U02SK1SM0G2"
    default: return ''
  }
}

/**
 * Builds an actions block from a provided array
 * @param {array} actions 
 * @returns 
 */
function getActionsBlock(actions) {
  const elements = [];
  for (let i = 0; i < actions.length; i += 1) {
    const action = actions[i];
    const button = {
      type: "button",
      text: {
        type: "plain_text",
        text: action.text,
        emoji: true
      },
      url: action.url
    };
    if (action.style) button.style = action.style;
    elements.push(button);
  }
  return {
    type: "actions",
    elements
  }
}

// Inputs
const TOKEN = core.getInput('token') || core.getInput('slack-token'); // slack-token is deprecated
const CHANNEL = core.getInput('channel') || "#devops";
const ACTIONS = core.getInput('actions') ? JSON.parse(core.getInput('actions')) : null;
const MESSAGE = core.getInput('message');

/**** EXTRACT DATA ****/
const ghContext = github.context;
const ghPayload = github.context.payload;

console.log(ghContext);

// Workflow info
const eventName = ghContext.eventName;
const workflow = ghContext.workflow;

// User information
const senderLogin = ghPayload.sender.login
const senderAvatar = ghPayload.sender.avatar_url;
const senderURL = ghPayload.sender.html_url;

/**
 * Generates the body of the API request
 * @param {string} channel 
 * @param {string} text 
 * @returns 
 */
function getBody(channel, text) {
  return {
    channel,
    text,
    blocks: []
  }
}

const notificationText = MESSAGE;

const body = getBody(CHANNEL, notificationText);

// Message
if (MESSAGE) {
  body.blocks.push({
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": `*${notificationText}*`,
    }
  })
}

// Optional body based on context
if (eventName === 'push') {
  const commitMessage = ghPayload.head_commit.message;
  body.blocks.push({
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": commitMessage,
    }
  })
} else if (eventName === 'pull_request') {
  body.blocks.push({
    "type": "header",
    "text": {
      "type": "plain_text",
      "text": ghPayload.pull_request.title,
      "emoji": true
    }
  })
  body.blocks.push({
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": ghPayload.pull_request.body,
    }
  })
}

// Add workflow title
body.blocks.push({
  "type": "context",
  "elements": [{ "type": "mrkdwn", "text": workflow }]
})

// Event context
function getContextString() {
  switch (eventName) {
    case 'push': {
      const branch = ghPayload.ref.substring(ghPayload.ref.lastIndexOf('/') + 1);
      const commitURL = ghPayload.head_commit.url;
      const commitHash = ghPayload.head_commit.id.substring(0, 7);

      return `<@${getSlackID(github.context.actor)}> · *${eventName}* · <${commitURL}|${commitHash}> on *${branch}*`;
    }
    case 'pull_request': {
      const action = ghPayload.action;
      return `<@${getSlackID(github.context.actor)}> · *${eventName}* ${action}`;
    }
    default:
      return 'Missing context...'
  }
}

body.blocks.push({
  "type": "context",
  "elements": [
    {
      "type": "image",
      "image_url": senderAvatar,
      "alt_text": `${senderLogin} avatar`
    },
    {
      "type": "mrkdwn",
      "text": getContextString()
    }
  ]
})

/** If actions exist, add them in */
if (ACTIONS) {
  body.blocks.push(getActionsBlock(ACTIONS));
}

postMessage(body, TOKEN);