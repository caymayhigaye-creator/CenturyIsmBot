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

    console.log(key)
    
    response.json('sa knk');
});

app.post('/centuryism', async (request, response) => {
    const headers = request.headers;
    const key = headers['x-key'];
    const data = headers['x-data'];

    if (!key) return console.log('given variables not found');
    
    if (key && headers && key === process.env.KEY) {
        console.log('an information came from Roblox (key succeded).');

        console.log(request.body);

        response.status(200).send('info claimed');
    } else {
        console.log('given key is false');
        response.status(403).send('Unauthorized');
    };
});

app.get('/centuryism', async (request, response) => {
    const headers = request.headers;
    const key = headers['x-key'];
    const get = headers['x-get'];

    if (!key || !get) return console.log('given variable are not founded');

    if (headers && key && key === process.env.KEY) {
        console.log('Posted ban list async. (key succeded)!');
        response.json(
            (get.toLowerCase() === 'expressstorage') ? ExpressStorage : (ExpressStorage[get] || null),
        );
    } else {
        console.log('The given key is false.');
        response.status(403).send('Unauthorized');
    };
});


export {ExpressStorage};