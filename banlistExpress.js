import express from 'express';

const app = express();
app.use(express.json());

const storage = {
    places: [],
    executedCommands : [],
};

app.post('/__post_commands', async (request, response) => {
    const headers = request.headers;
    const key = headers['x-key'];

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server ${PORT} port is working`)
});

app.get('/__get_commands', async (request, response) => {
    const headers = request.headers;
    const key = headers['x-key'];
    const get = headers['x-get'];

    if (!key || !get) return console.log('given variable are not founded');

    if (headers && key && key === process.env.KEY) {
        console.log('Posted ban list async. (key succeded)!');
        response.json(
            (get === storage) ? storage : (storage[get] || null),
        );
    } else {
        console.log('The given key is false.');
        response.status(403).send('Unauthorized');
    };
});


export {storage};