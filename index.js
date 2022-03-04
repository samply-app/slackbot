const request = require('request');
const core = require('@actions/core');
const github = require('@actions/github');

// Inputs
const TOKEN = core.getInput('token');
const CHANNEL = core.getInput('channel') || "#devops"

function postMessage(body) {
  // Configure API request
  const options = {
    method: 'POST',
    url: 'https://slack.com/api/chat.postMessage',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${TOKEN}`
    },
    body,
  };
  // Make request
  request(options, (error, response) => {
    if (error) throw new Error(error);
    // Read API response
    const body = JSON.parse(response.body);
    if (!body.ok) {
      console.log('Slack API response:', body);
      throw new Error(response.body.error);
    }
  });
}

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
          "type": "mrkdwn",
          "text": "*push* to <github.com | main> · <github.com|bc9e816> by <@U02SK1SM0G2>"
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
						"text": "View production preview",
						"emoji": true
					},
					"url": "https://github.com"
				}
			]
		}
  ]
})