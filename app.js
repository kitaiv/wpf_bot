const TelegramBot = require("node-telegram-bot-api");
const wallpaperCategory = require("./categories");
const axios = require("axios");
require("./server");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

let counter = 0;
let picList = [];

//Setting custom commands
bot.setMyCommands([
  { command: "/start", description: "Start the bot" },
  { command: "/categories", description: "Choose a category" }
]);

const categories_opts = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [
        {
          text: "🌱 " + wallpaperCategory.nature,
          callback_data: wallpaperCategory.nature
        }
      ],
      [
        {
          text: "🛻 " + wallpaperCategory.cars,
          callback_data: wallpaperCategory.cars
        }
      ],
      [
        {
          text: "⚽ " + wallpaperCategory.sport,
          callback_data: wallpaperCategory.sport
        }
      ],
      [
        {
          text: "🎮 " + wallpaperCategory.game,
          callback_data: wallpaperCategory.game
        }
      ]
    ]
  })
};

const moveToCategory = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [{ text: "Show categories", callback_data: "show_categories" }]
    ]
  })
};

const controler = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [
        { text: "⬅️", callback_data: "_back" },
        { text: "➡️", callback_data: "_next" }
      ],
      [{ text: "Convert to file", callback_data: "convert_to_file" }]
    ]
  })
};

const showCategories = (chatId, msgId, type) => {
  switch (type) {
    case "new_message":
      bot.sendMessage(chatId, "Choose a category", categories_opts);
      break;
    case "update_message":
      bot.editMessageText("Choose a category", {
        chat_id: chatId,
        message_id: msgId,
        ...categories_opts
      });
      break;
    default:
      break;
  }
};

const handleControlMedia = (chatId, msgId, type) => {
  const getPicId = picList.findIndex((picId) => picId === counter);
  // if (getPicId === 0 || !getPicId) return false;
  try {
    if (type === "_next") {
      if (counter === picList.length - 1) counter = 0;
      if (counter !== picList.length - 1) counter++;
      return bot.editMessageMedia(
        JSON.stringify({ type: "photo", media: picList[counter] }),
        { chat_id: chatId, message_id: msgId, ...controler }
      );
    }

    if (type === "_back") {
      if (counter === 0) counter = picList.length - 1;
      if (counter !== 0) counter--;
      return bot.editMessageMedia(
        JSON.stringify({ type: "photo", media: picList[counter] }),
        { chat_id: chatId, message_id: msgId, ...controler }
      );
    }

    if (type === "_start") counter = 0;
    return bot.sendPhoto(chatId, picList[counter], controler, {protect_content: true});
  } catch (e) {
    console.log(e);
  }
};

const getPicByCategory = (chatId, category) => {
  axios
    .get(`https://wpfn-bot.herokuapp.com/api/get?category=${category}`)
    .then((res) => {
      res.data.forEach((pic) => {
        picList.push(pic.url)
        picList.reverse();
      });
      bot.sendPhoto(chatId, picList[0], controler, {protect_content: true});
    })
    .catch((err) => {
      console.log("Error: ", err.message);
    });
};

const handleConvertToFile = (chatId) => {
  const picUrl = picList[counter];
  return bot.sendDocument(chatId, picUrl, {
    allow_sending_without_reply: false
  });
};

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const command = msg.text;
  const messageId = msg.message_id;
  switch (command) {
    case "/start":
      console.log('chatId >>> ', chatId)
      await bot.sendMessage(
        chatId,
        "Hello, I am a wallpaper bot!",
        moveToCategory
      );
      counter = 0;
      break;
    case "/categories":
      await showCategories(chatId, messageId, "new_message");
      counter = 0;
      break;
    default:
      await bot.sendMessage(chatId, "Unknown command! Try /start");
      break;
  }
});

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const { data } = query;
  switch (data) {
    case wallpaperCategory.nature:
      counter = 0;
      picList = [];
      await getPicByCategory(chatId, wallpaperCategory.nature);
      break;
    case wallpaperCategory.cars:
      counter = 0;
      picList = [];
      await getPicByCategory(chatId, wallpaperCategory.cars);
      break;
    case wallpaperCategory.sport:
      counter = 0;
      picList = [];
      await getPicByCategory(chatId, wallpaperCategory.sport);
      break;
    case wallpaperCategory.game:
      counter = 0;
      picList = [];
      await getPicByCategory(chatId, wallpaperCategory.game);
      break;
    case "convert_to_file":
      try {
        // bot.getFile(picList[0]).then(async (data) => console.log(data));
        await handleConvertToFile(chatId);
      } catch (error) {
        console.log(error);
      }
      break;
    case "show_categories":
      await showCategories(chatId, messageId, "update_message");
      break;
    case "_back":
      try {
        await handleControlMedia(chatId, messageId, "_back");
      } catch (error) {
        console.log(error);
      }
      break;
    case "_next":
      try {
        await handleControlMedia(chatId, messageId, "_next");
      } catch (error) {
        console.log(error);
      }
      break;
    default:
      break;
  }
});
