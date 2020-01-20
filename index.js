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
    const senderURL = payload.sender.url;    
    // Action Input
    const template = core.getInput('template');
    const inputMessage = core.getInput('message');
    const channel = core.getInput('channel') || "#general";
    const slackToken = core.getInput('slack-token');
    // Slack message content
    let message = inputMessage;
    let blocks; // Slack
    switch (template) {
        case templates.none:
            console.log("No template");
            blocks = [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: message
                    }
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `<${senderURL}|${senderLogin}>`
                    }
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
                        text: message
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
    // console.log(`The event payload: ${payload}`);
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
        console.log(response.body);
    });
}