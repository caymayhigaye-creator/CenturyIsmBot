import { NewsChannel } from "discord.js";
import mongoose from "mongoose";

mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log('Mongodb has initalized');
}).catch((reason) => {
    console.log('Mongo db is not initalized', reason)
})

const BotStorage = {};

const NewSchema = new mongoose.Schema({
    ReactionEmoji: String,
    Channel: String,
    MessageId: String,
    guildId: {
        type: String,
        required: true,
    },
}, {
    strict: true
});

const ReactionModel = mongoose.model('ReactionData', NewSchema);
const SavedScriptsModel = mongoose.model('SavedScripts', new mongoose.Schema({}, {
    strict: false,
}));

export {BotStorage, ReactionModel, SavedScriptsModel};
