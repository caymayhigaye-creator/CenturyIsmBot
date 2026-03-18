import { ThreadAutoArchiveDuration } from 'discord.js';
import express from 'express';

const app = express();
app.use(express.json());

const ExpressStorage = {
    savedGames: {},
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server ${PORT} port is working`)
});

app.delete('/centuryism', async (request, response) => {
    const headers = request.headers;
    const key = headers['x-key'];
    const placeId = headers['x-place-id'];  
    const source = headers['x-source'];
    const method = headers['x-method'];

    if (!key || !placeId || !source) return(console.log('placeId or key not found!'));

    if (key == process.env.KEY) {
        if (method && method.toLowerCase() == 'stopproxy') {
            console.log('Delete succesfull');
            console.log(ExpressStorage.savedGames)
            delete ExpressStorage.savedGames[placeId];
            response.status(200).send('Succesfully Delete PlaceId from SavedGames!');
        } else {
            if (ExpressStorage.savedGames[placeId] && ExpressStorage.savedGames[placeId].executeds) {
                const Filtered = ExpressStorage.savedGames[placeId].executeds.filter(obj => obj.Source !== source);
                ExpressStorage.savedGames[placeId].executeds = Filtered;
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
    const headers = request.headers;
    const key = headers['x-key'];
    const placeId = headers['x-place-id'];;
    const gameName = headers['x-game-name'];

    if (!key || !placeId || !gameName) return(console.log('given variables not found'));
    if (ExpressStorage[placeId]) return(console.log('Already saved data of the game'));
    
    if (key && headers && key === process.env.KEY) {
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
    const key = headers['x-key'];
    const placeId = headers['x-place-id'];

    if (!key || !placeId) return(console.log('given variable are not founded'));

    if (headers && key && key === process.env.KEY) {
        response.json(
            (ExpressStorage.savedGames[placeId]) ? (ExpressStorage.savedGames[placeId]) : null,
        );
    } else {
        console.log('The given key is false.');
        response.status(403).send('Unauthorized');
    };
});


export {ExpressStorage};