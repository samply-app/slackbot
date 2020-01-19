const request = require('request');
const core = require('@actions/core');
const github = require('@actions/github');

try {
    // Get inputs
    const message = core.getInput('message') || "Fallback";
    const slackToken = core.getInput('slack-token');   
    // const slackToken = "xoxb-570934843381-899781945906-SuPQ46qAmej8RKwdKUDJYLXN"
    const slackBody = {
        channel: "GS4751SRE",
        text: message,
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: message
                }
            },
            // {
            //     type: "actions",
            //     elements: [
            //         {
            //             type: "button",
            //             text: {
            //                 type: "plain_text",
            //                 text: "Review 🔧",
            //                 emoji: true
            //             },
            //             url: "https://samply.app"
            //         }
            //     ]
            // }
        ]
    }
    tellSlack(JSON.stringify(slackBody), slackToken);
    const payload = JSON.stringify(github.context.payload, undefined, 2);
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