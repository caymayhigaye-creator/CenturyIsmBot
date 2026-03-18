import { SlashCommandBuilder, EmbedBuilder, Embed, CategoryChannel, ButtonBuilder, IntegrationExpireBehavior, verifyString, Events} from "discord.js";
import mongoose, { Mongoose } from "mongoose";
import axios from 'axios';
import { ExpressStorage } from './storageExpress.js';
import { BotStorage, ReactionModel } from "./BotStorage.js";

const commands = [
    {
        name: 'profileviewer',

        data : new SlashCommandBuilder()
        .setName('profileviewer')
        .setDescription('View Roblox User Profile.')
        .addStringOption(option => 
            option.setName('userinfo')
            .setDescription('Put who you want to view user profile.')
            .setRequired(true)
        )
        .toJSON(),

        async execute() {
            const args = arguments;
            const interaction = args[0];
            const client = args[1];

            try {
                const userInfo = interaction.options.getString('userinfo') || interaction.options.getNumber('userinfo');
                let userId;

                if (!userInfo) return interaction.reply('Invalid User Info');
                if (isNaN(userInfo)) {
                    const newuserResponse = await axios.post('https://users.roblox.com/v1/usernames/users', {
                        usernames: [userInfo]
                    });
                    const userData = await newuserResponse.data;
                    userId = await userData.data[0].id;
                } else {
                    userId = userInfo;
                };

                const [Profile, Thumbnail] = await Promise.all([
                    axios.get(`https://users.roblox.com/v1/users/${userId}`),
                    axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`)
                ]);  

                const data = Profile.data;
                const avatarUrl = Thumbnail.data.data[0].imageUrl;

                const embed = new EmbedBuilder()
                .setTitle(`${data.displayName} (@${data.name})`)
                .setThumbnail(avatarUrl)
                .setURL(`https://www.roblox.com/users/${userId}/profile`)
                .setColor('Aqua')
                .setDescription('User Profile Details')
                .setFields(
                    {name: 'User Bio: ', value: data.description, inline: true},
                    {name: 'Is Verified?: ', value: data.hasVerifiedBadge ? 'Yes' : 'No', inline: true},
                    {name: 'Banned?: ', value: data.isBanned ? 'Yes' : 'No', inline: false},
                    {name: 'Creation Time: ', value: data.created, inline: true},
                )
                .setTimestamp()
                .setFooter({
                    text: 'Roblox Profile Info Data.',
                });

                interaction.reply({
                    embeds: [embed],
                });
                
            } catch(e) {
                interaction.reply(e.message);
            };
        },

    },
    {
        name: 'executecommand',

        data : new SlashCommandBuilder()
        .setName('executecommand')
        .setDescription('Execute command in game')
        .addStringOption(option => 
            option.setName('placeid')
            .setDescription('text placeid where you want to execute the code')
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('script')
            .setDescription('put here the script what you want to execute')
            .setRequired(true)
        ).toJSON(),

        AutoComplete: true,
        async AutoCompleteFunction(interaction) {
            const focusedValue = interaction.options.getFocused();
            const choices = Object.keys(ExpressStorage.savedGames);
            const filtered = choices.filter(id => {
                const gameData = ExpressStorage.savedGames[id];
                return (
                    id.includes(focusedValue) || gameData.gameName.toLowerCase().includes(focusedValue)
                );
            });   
            await interaction.respond(
                filtered.slice(0, 25).map(gameId => ({name: `${ExpressStorage.savedGames[gameId].gameName} (${gameId})`, value:String(gameId)})),
            );
        },

        async execute() {
            const args = arguments;
            const interaction = arguments[0];
            const client = arguments[1];
            const placeId = interaction.options.getString('placeid');
            const scriptCode = interaction.options.getString('script');

            if (!scriptCode || !placeId) 
                {
                    return(interaction.reply('make you sure you inputed the correct script & placeid'))
                } else if (!ExpressStorage.savedGames[String(placeId)]) {
                    return(interaction.reply('The game is not found in backdoor saved games.'));
                }

            try {

                const gameinfoPromise = new Promise(async (callback, err) => {
                    const universeresponse = await axios.get(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`); // 6787156005
                    const universedata = await universeresponse.data;
                    const universeId = universedata && universedata.universeId ? universedata.universeId : null;
                    
                    const gameinforesponse = await axios.get(`https://games.roblox.com/v1/games?universeIds=${universeId}`);
                    const gameinfodata = await gameinforesponse.data.data[0];
                    
                    if (gameinfodata) {
                        return(callback(gameinfodata));
                    } else {
                        return(err('game info data not found.'))
                    }
                });
                const gameinfo = await gameinfoPromise;
                const gameImageResponse = await axios.get(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${gameinfo.id}&size=150x150&format=Png&isCircular=false`);
                const gameImagedata = await gameImageResponse.data.data[0];
                const gameImageUrl = await gameImagedata.imageUrl ? gameImagedata.imageUrl : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThxpwPKHBP41r-01lGuLh4YE2Q7rG4EUv13A&s.png'

                if (ExpressStorage.savedGames[String(placeId)] && ExpressStorage.savedGames[String(placeId)].executeds) {
                    ExpressStorage.savedGames[String(placeId)].executeds.push({
                        PlaceId: placeId,
                        Source : scriptCode,
                    });
                };

                const Embed = new EmbedBuilder()
                .setTitle(`# **ExecutingScript: \`\`\`lua\n${scriptCode}\n\`\`\`**`)
                .setColor(0x66ff00)
                .setDescription(`# **${gameinfo.name}**`)
                .setThumbnail(gameImageUrl)
                .addFields([
                    {   
                        name: `**━━ Game Info ━━**`, 
                        value:
                        `> **Name:** ${gameinfo.name}\n`+
                        `> **Game Link:** [Link](https://roblox.com/games/${gameinfo.rootPlaceId})/\n`+
                        `> **Active Players:** \`${gameinfo.playing}\`\n`+
                        `> **Visits:** \`${gameinfo.visits}\`\n`
                    , inline:true
                    },
                    {
                        name: '**━━ Owner Info ━━**', 
                        value: 
                        `> **Creator Name:** \`${gameinfo.creator.name}\`\n`+ 
                        `> **Creator Id:** \`${gameinfo.creator.id}\`\n`+
                        `> **Creator Link:** [Link](https://roblox.com/users/${gameinfo.creator.id}/profile)\n`+
                        `> **Verified: **${(gameinfo.creator.hasVerifiedBadge === true) ? '# **Yes**' : 'No'}`
                        , inline:true
                    },
                    {
                        name: '**━━ Settings ━━**',
                        value:
                        `> **AvatarRigType:** ${(gameinfo.universeAvatarType == 'MorphToR15') ? 'R15' : 'R6'}\n`+
                        `> **API Enabled:** ${(gameinfo.studioAccessToApisAllowed == true) ? '# **Yes**' : 'No'}\n`+
                        `> **Copying Allowed:** ${(gameinfo.copyingAllowed == true) ? '# **Yes**' : 'No'}`
                        , inline:true
                    },
                    {
                        name: '**━━ Join Code ━━**',
                        value: `\`\`\`js\n`+
                        `javascript:Roblox.GameLauncher.joinGameInstance(${gameinfo.rootPlaceId}, ${null});\n`+
                        `\`\`\``
                        , inline: false,
                    },
                    
                ])
                .setTimestamp(new Date())
                .setFooter({text: 'Game Has Detected'});    

                interaction.reply({
                    embeds: [Embed],
                });
                
            } catch(e) {
                interaction.reply(e.message);
            };
        },
    },
    {
        name: 'reacttoacces',

        data: new SlashCommandBuilder()
        .setName('reacttoacces')
        .setDescription('Create react accesing to the server!')
        .addStringOption(option => 
            option.setName('reaction')
            .setDescription('What kind emoji you want people to react and get verified')
            .setRequired(true)
        ).toJSON(),

        async execute() {
            const args = arguments;
            const interaction = args[0];
            const client = args[1];

            const getReaction = interaction.options.getString('reaction');
            if (!getReaction) {
                interaction.reply('Message did not found');

                setTimeout(() => {
                    interaction.deletereply();
                }, 3000);

                return;
            };

            let ReactionData;
            if (BotStorage.ReactionData) {
                setTimeout(() => {
                    return(interaction.deleteReply());
                }, 3000);
                return(interaction.reply('Reaction data has already been initilized'));
            };

            try {

                const verifiyEmbed = new EmbedBuilder()
                .setTitle('Verify To Access')
                .setDescription('Click to get verified')
                .setColor(0x0099ff)
                .setFooter({
                    text: `Verify - ${client.user.username}`,
                })
                .setTimestamp(new Date())

                const channel = await interaction.channel;
                await channel.bulkDelete(100, true);

                const newMessage = await channel.send({
                    embeds: [verifiyEmbed],
                });

                BotStorage.ReactionData = {};
                const ReactionData = BotStorage.ReactionData;
                ReactionData.ReactionEmoji = getReaction;
                ReactionData.Channel = interaction.channel;
                ReactionData.MessageId = newMessage.id;
                ReactionData.GuildId = 

                await ReactionModel.findOneAndUpdate(
                    {guildId: interaction.guildId},
                    {
                        ReactionEmoji: getReaction,
                        Channel: channel,
                        MessageId: newMessage.id,
                        guildId: interaction.guildId,
                    },
                    {
                        upsert: true,
                        returnDocument: 'after',
                        setDefaultsOnInsert: true,
                    },
                );
                
                await newMessage.react(getReaction);

                await interaction.reply('Message succesfully created & saved!')
                setTimeout(() => {
                    interaction.deleteReply();
                }, 3000);
            } catch(e) {
                interaction.reply(e.message);
                setTimeout(() => {
                    interaction.deleteReply();
                }, 3000);
            };
        },
    },
];

export default commands;