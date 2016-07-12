
import botkit from 'botkit';
// this is es6 syntax for importing libraries
// in older js this would be: var botkit = require('botkit')

// Got from the yelp website, help intstructions
const Yelp = require('yelp');

const yelp = new Yelp({
  consumer_key: 'hqR-XWucZunJ8Nx53DUcTQ',
  consumer_secret: 'a6kEtqDFt6HPj1caNWqWNOMXt6k',
  token: 'k38_-VwcfAkzGjBRYJ1StAnZITk3H7w7',
  token_secret: '7_vfF-UZsrAuWykndJQ-W96hsCE',
});

// botkit controller
const controller = botkit.slackbot({
  debug: false,
});

// initialize slackbot
const slackbot = controller.spawn({
  token: process.env.SLACK_BOT_TOKEN,
  // this grabs the slack token we exported earlier
}).startRTM(err => {
  // start the real time message client
  if (err) { throw new Error(err); }
});

// prepare webhook
// for now we won't use this but feel free to look up slack webhooks
controller.setupWebserver(process.env.PORT || 3001, (err, webserver) => {
  controller.createWebhookEndpoints(webserver, slackbot, () => {
    if (err) { throw new Error(err); }
  });
});

controller.on('outgoing_webhook', (bot, message) => {
  bot.replyPublic(message, 'yeah yeah');
});

// hello response
controller.hears(['hello', 'hi', 'howdy', 'what is up', 'what is cooking'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.api.users.info({ user: message.user }, (err, res) => {
    if (res) {
      bot.reply(message, `Hello, ${res.user.name}!`);
    } else {
      bot.reply(message, 'Hello there!');
    }
  });
});

// bassic conversation
controller.hears(['I need to talk'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.startConversation(message, (err, convo) => {
    convo.ask('Would you like to talk to me?', [
      {
        pattern: bot.utterances.yes,
        callback: (response, basicConvo) => {
          convo.ask('What have you been up to today', (today, todayConvo) => {
            convo.ask('That sounds like an alright day. What are your plans for tomorrow?', (tomorrow, tomorrowConvo) => {
              bot.reply(message, 'No matter what, go out and crush tomorrow!');
              convo.next();
            });
            convo.next();
          });
          convo.next();
        },
      },
      {
        pattern: bot.utterances.no,
        callback: (response, rconvo) => {
          bot.reply(message, 'Thats ok. I am here to talk whenever.');
          convo.stop();
        },
      },
      {
        default: true,
        callback(response, rconvo) {
          bot.reply(message, 'What was that?');
          convo.repeat();
          convo.next();
        },
      },
    ]);
  });
});

// response to help
controller.hears(['help', 'assistence', 'aid'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.startConversation(message, (err, convo) => {
    convo.ask('What would you like help with', (help, helpConvo) => {
      bot.reply(message, 'That sounds tricky. Maybe you should call a friend');
    });
    convo.next();
  });
});

// response to eat, food help from https://github.com/howdyai/botkit/blob/master/readme.md#multi-message-replies-to-incoming-messages
controller.hears(['eat', 'food', 'hungry', 'resturaunt'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
// Got converstation set up from
  bot.startConversation(message, (err, convo) => {
    convo.ask('Do want to find a place to eat?', [
      {
        // got "utterances" and pattern call back structure from, slack start convo
        pattern: bot.utterances.yes,
        callback: (response, rconvo) => {
          // puts location in location
          convo.ask('Great, where are you?', (location, locationConvo) => {
            // gets type of food
            convo.ask('What type of food are you feeling?', (type, typeConvo) => {
              bot.reply(message, 'Looking around, one sec...');
              convo.next();
              // messed with the yelp stuff online found at to do the yelp search
              // from search documentation https://www.yelp.com/developers/documentation/v2/search_api
              // and https://github.com/olalonde/node-yelp
              yelp.search({ term: type.text, location: location.text })
              .then((data) => {
                bot.reply(message, {
                  // created attachment with help from slack api, with changes
                  // https://api.slack.com/docs/message-attachments
                  attachments: [
                    {
                      color: '#36a64f',
                      pretext: 'I think this is a good resturaunt for you',
                      title: `${data.businesses[0].name}`,
                      title_link: `${data.businesses[0].url}`,
                      // got multi line format from https://api.slack.com/docs/message-formatting
                      text: `Rating: ${data.businesses[0].rating} \nPhone: ${data.businesses[0].display_phone}`,
                      image_url: `${data.businesses[0].image_url}`,
                    },
                  ],
                });
              });
              convo.next();
            });
            convo.next();
          });
          convo.next();
        },
      },
      {
        pattern: bot.utterances.no,
        callback: (response, noconvo) => {
          bot.reply(message, 'That is too bad, I know of a lot of really good places to eat');
          convo.stop();
        },
      },
      {
        default: true,
        callback(response, defaultconvo) {
          convo.say('Woops, I dont understand what you mean');
          convo.repeat();
          convo.next();
        },
      },
    ]);
  });
});

      // {
      //   pattern: 'done',
      //   callback(response) {
      //     convo.say('OK you are done!');
      //     convo.next();
      //   },
      // },
      // {
      //   pattern: bot.utterances.yes,
      //   callback(response) {
      //     convo.say('Great! I will continue...');
      //     convo.ask('Where are you?', [
      //       {
      //
      //       },
      //     ]);
      //     // do something else...
      //     convo.next();
      //   },
      // },
      // {
      //   pattern: bot.utterances.no,
      //   callback(response) {
      //     convo.say('Perhaps later.');
      //     // do something else...
      //     convo.next();
      //   },
      // },
      // {
      //   default: true,
      //   callback(response) {
      //     // just repeat the question
      //     convo.repeat();
      //     convo.next();
      //   },
      // },
//     ]);
//   });
// });

// controller.on('user_typing', (bot, message) => {
//   bot.reply(message, 'stop typing!');
// });


console.log('starting bot 2');
