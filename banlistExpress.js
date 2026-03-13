import express from 'express';

const app = express();
app.use(express.json());

app.post('/update-bans', async (req, res) => {
    const headers = req.headers;
    const key = headers['x-key'];
    
    
    if (key && headers && key === process.env.KEY) {
        console.log('an information came from Roblox (key succeded).');
        const newBanList = req.body;

         storage.banList = newBanList;
        res.status(200).send('info claimed');
    } else {
        console.log('given key is false');
        res.status(403).send('Unauthorized');
    };
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server ${PORT} port is working`)
});

app.get('/get-bans', async (req, res) => {
    const headers = req.headers;
    const key = req.headers['x-key'];

    if (headers && key && key === process.env.KEY) {
        console.log('Posted ban list async. (key succeded)!');
        res.json(storage.banList);
    } else {
        console.log('The given key is false.');
        res.status(403).send('Unauthorized');
    };
});

export const storage = {
    banList: {},
};
