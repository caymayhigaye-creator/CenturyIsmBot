import { SlashCommandBuilder, EmbedBuilder, Embed, CategoryChannel, ButtonBuilder} from "discord.js";
import axios from 'axios';
import {storage} from './storageExpress.js';

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
                    userId = newuserData.data[0].id;
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
            .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('script')
            .setDescription('put here the script what you want to execute')
            .setRequired(true)
        ).toJSON(),

        async execute() {
            const args = arguments;
            const interaction = arguments[0];
            const client = arguments[1];
            const placeId = interaction.options.getString('placeid');
            const scriptCode = interaction.options.getString('script');

            if (!scriptCode || !placeId) 
                {
                    return(interaction.reply('make you sure you inputed the correct script & placeid'))
                } else if (!storage.savedGames[String(placeId)]) {
                    return(interaction.reply('The game is not found in backdoor saved games.'));
                } else {return(interaction.reply('Something went wrong idk!'))};

            try {

                const gameinfoPromise = new Promise(async (callback, err) => {
                    const universeresponse = await axios.get(`https://apis.roblox.com/universes/v1/places/80790491696418/universe`); // 6787156005
                    const universedata = await universeresponse.data;
                    const universeId = universedata && universedata.universeId ? universedata.universeId : null;
                    
                    const gameinforesponse = await axios.get('https://games.roblox.com/v1/games?universeIds=6787156005');
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

                if (storage.savedGames[String(placeId)] && storage.savedGames[String(placeId)].executedCommands) {
                    storage.savedGames[String(placeId)].executedCommands.push({
                        placeId: placeId,
                        Source : scriptCode,
                    });
                };

                console.log(storage.savedGames);

                const Embed = new EmbedBuilder()
                .setTitle(`# **ExecutingScript: ${scriptCode}**`)
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
];

export default commands;