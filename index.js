const request = require('request');
const core = require('@actions/core');
const github = require('@actions/github');

// Inputs
const TOKEN = core.getInput('token') || core.getInput('slack-token'); // slack-token is deprecated
const CHANNEL = core.getInput('channel') || "#devops"

const _rawActions = core.getInput('actions');
const ACTIONS = _rawActions ? JSON.parse(_rawActions) : null;
console.log(ACTIONS);

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

function postMessage(body) {
  // Configure API request
  const options = {
    method: 'POST',
    url: 'https://slack.com/api/chat.postMessage',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${TOKEN}`
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


/**** EXTRACT DATA ****/
const ghContext = github.context;
const ghPayload = github.context.payload;

// Workflow info
const eventName = ghContext.eventName;
const workflow = ghContext.workflow;
const branch = ghPayload.ref.substring(ghPayload.ref.lastIndexOf('/') + 1);

// User information
const senderLogin = ghPayload.sender.login
const senderAvatar = ghPayload.sender.avatar_url;
const senderURL = ghPayload.sender.html_url;

// Commit info (this may not exist)
const commitURL = ghPayload.head_commit.url;
const commitMessage = ghPayload.head_commit.message;
const commitHash = ghPayload.head_commit.id.substring(0, 7);


/**
 * Generates a generic context block.
 * Should work for all triggers and workflows.
 * @returns 
 */
function getContextBlock() {
  //
}

function getBody(channel, text) {
  return {
    channel,
    text,
    blocks: []
  }
}

const notificationText = ':tada: Integration successful'

const body = getBody(CHANNEL, notificationText);

// Message body
body.blocks.push({
  "type": "section",
  "text": {
    "type": "mrkdwn",
    "text": `*${notificationText}*\n\n${commitMessage}`,
  }
})

// Workflow specifc context
body.blocks.push({
  "type": "context",
  "elements": [
    {
      "type": "mrkdwn",
      "text": `${workflow} · <${commitURL}|${commitHash}>`
    }
  ]
})

// Context
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
      "text": `<@${getSlackID(github.context.actor)}> · *${eventName}* on *${branch}*`
    }
  ]
})

if (ACTIONS) {
  const elements = [];
  for (let i = 0; i < ACTIONS.length; i += 1) {
    const action = ACTIONS[i];
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
  body.blocks.push({
    type: "actions",
    elements
  });
}



postMessage(body)