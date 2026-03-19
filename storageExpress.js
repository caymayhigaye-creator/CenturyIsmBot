import { ThreadAutoArchiveDuration } from 'discord.js';
import express from 'express';

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));

const ExpressStorage = {
    savedGames: {},
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
    const {GAME_INFO, KEY} = request.body;
    const placeId = GAME_INFO.PLACE_ID;
    const gameName = GAME_INFO.GAME_NAME;

    if (!KEY || !placeId || !gameName) return(console.log('given variables not found'));
    if (ExpressStorage[placeId]) return(console.log('Already saved data of the game'));
    
    if (KEY && KEY === process.env.KEY) {
        ExpressStorage.savedGames[placeId] = {
            executeds: [],
            gameName: gameName,
        };

        response.status(200).send('info claimed');
    } else {
        console.log('given key is false');
        response.status(403).send('Unauthorized');
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