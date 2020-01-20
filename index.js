const request = require('request');
const core = require('@actions/core');
const github = require('@actions/github');

const templates = {
    none: 'none',
    ciStatus: 'ci-status',
};

try {
    // Github Payload
    const payload = github.context.payload;
    console.log(github.context);
    const senderLogin = payload.sender.login;
    const senderURL = payload.sender.html_url; 
    const senderAvatar = payload.sender.avatar_url;
    const commitURL = payload.head_commit.url;
    // Action Input
    const template = core.getInput('template');
    const inputMessage = core.getInput('message');
    const channel = core.getInput('channel') || "#general";
    const slackToken = core.getInput('slack-token');
    // Slack message content
    let message = inputMessage;
    let blocks; // Slack
    switch (template) {
        case templates.none || undefined:
            console.log("No template");
            blocks = [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `"${message}" - <${senderURL}|*${senderLogin}*>`
                    }
                },
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "View Commit",
                                "emoji": true
                            },
                            "url": commitURL
                        }
                    ]
                }
            ]
            break;
        default:
            console.log("Default");
            blocks = [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `${message}\n- <${senderURL}|*${senderLogin}*>`,
                    },
                    accessory: {
                        type: "image",
                        image_url: senderAvatar,
                        alt_text: `${senderLogin} profile photo`
                    }
                }
            ];
            break;
    }

    const slackBody = {
        channel,
        text: message,
        blocks,
    }
    tellSlack(JSON.stringify(slackBody), slackToken);
} catch (error) {
    core.setFailed(error.message);
}

function tellSlack(body, token) {
    const options = {
        method: 'POST',
        url: 'https://slack.com/api/chat.postMessage',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': `Bearer ${token}`
        },
        body,
    };
    request(options, function (error, response) {
        if (error) throw new Error(error);
        if (!response.body.ok) throw new Error(response.body.error);
    });
}