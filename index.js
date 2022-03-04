const request = require('request');
const core = require('@actions/core');
const github = require('@actions/github');

// Inputs
const TOKEN = core.getInput('token');
const CHANNEL = core.getInput('channel') || "#devops"

console.log(github.context);
console.log(github.context.payload);

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


// Pull off data
const ghContext = github.context;
const ghPayload = github.context.payload;

// User information
const senderLogin = ghPayload.sender.login
const senderAvatar = ghPayload.sender.avatar_url;
const senderURL = ghPayload.sender.html_url;

console.log(senderLogin, senderAvatar, senderURL);

postMessage({
  channel: CHANNEL,
  text: ":tada: Built a better Slackbot",
  blocks: [
    // Notification text
    {
      "type": "section",
      "text": {
        "type": "plain_text",
        "text": ":tada: Built a better Slackbot",
        "emoji": true
      }
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
          "text": `<@${getSlackID(github.context.actor)}> · *push* to <github.com | main> · <github.com|bc9e816>`
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