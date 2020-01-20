const request = require('request');
const core = require('@actions/core');
const github = require('@actions/github');

const templates = {
    json: 'json',
    status: 'status',
};

const colors = {
    success: '#2EB67D',
    failure: '#E01E5A',
    cancelled: '#ECB22E',
    default: '#2EADFF'
};

try {
    // Github Payload
    const payload = github.context.payload;
    const {eventName, workflow} = github.context;
    const senderLogin = payload.sender.login;
    const senderURL = payload.sender.html_url; 
    const senderAvatar = payload.sender.avatar_url;
    const commitURL = payload.head_commit.url;
    const commitMessage = payload.head_commit.message;
    const commitHash = payload.head_commit.id.substring(0, 7);
    const repositoryName = payload.repository.name;
    const repositoryURL = payload.repository.html_url;
    const branch = payload.ref.substring(payload.ref.lastIndexOf('/') + 1);
    // --- Action Input ---
    // Required
    const message = core.getInput('message');
    const slackToken = core.getInput('slack-token');
    // Optional
    const template = core.getInput('template');    
    const channel = core.getInput('channel') || "#general";
    // Template: status
    const status = (core.getInput('status') || '').toLowerCase();
    console.log({
        message,
        template,
        channel,
        status
    });
    console.log(colors, colors[status]);
    
    // Slack message content
    let slackBody;
    switch (template) {
        // Send raw json payload
        case templates.json:
            slackBody = JSON.parse(message);
            break;
        // Git push status update
        case templates.status:            
            const emoji = status === 'success' ? ':tada:' :
                          (status === 'failure' ? ':upside_down_face:' : '');
            const notificationText = `${emoji} ${capitalize(status)}: ${workflow} (${repositoryName})`;
            const bodyText = `*${capitalize(status)}*: <${repositoryURL}|${repositoryName}>`
            slackBody = {
                channel,
                text: notificationText,
                blocks: [
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: bodyText
                        }
                    }
                ],
                attachments: [
                    {
                        color: colors[status] || colors.default,
                        blocks: [
                            {
                                type: "section",
                                text: {
                                    type: "mrkdwn",
                                    text: `*${workflow}* (${branch})`
                                }
                            },
                            {
                                type: "section",
                                text: {
                                    type: "mrkdwn",
                                    text: `<${commitURL}|${commitHash}> - _${commitMessage}_`
                                }
                            },
                            {
                              type: "divider"
                            },
                            {
                                type: "context",
                                elements: [
                                    {
                                        type: "image",
                                        image_url: senderAvatar,
                                        alt_text: `${senderLogin} profile photo`
                                    },
                                    {
                                        type: "mrkdwn",
                                        text: `Triggered by *${eventName}* event from <${senderURL}|*${senderLogin}*>`
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };
            break;
        default:
            break;
    }
    tellSlack(JSON.stringify(slackBody), slackToken);
} catch (error) {
    console.log(error);    
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
        const body = JSON.parse(response.body);
        if (!body.ok) {
            console.log(body);    
            throw new Error(response.body.error);
        }
    });
}

function capitalize(s) {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
  }