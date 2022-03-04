const request = require('request');
const core = require('@actions/core');
const github = require('@actions/github');

// Inputs
const TOKEN = core.getInput('token');
const CHANNEL = core.getInput('channel') || "#devops"

console.log(github.context);

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
      console.log(response);
      console.error(response.body);
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

postMessage({
  channel: CHANNEL,
  text: `:tada: Integration successful (${commitMessage})`,
  blocks: [
    // Header message
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": `:tada: Integration successful`,
        "emoji": true
      }
    },
    // Message body
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `_${commitMessage}_`,
        "emoji": true
      } 
    },
    // Workflow specifc context
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": `*${workflow}* · <${commitURL}|${commitHash}>`
        }
      ]
    },
    // Context    
     {
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
    },
    // Actions
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "style": "primary",
          "text": {
            "type": "plain_text",
            "text": "Production preview",
            "emoji": true
          },
          "url": "https://github.com"
        },
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Staging",
            "emoji": true
          },
          "url": "https://github.com"
        }
      ]
    }
  ]
})