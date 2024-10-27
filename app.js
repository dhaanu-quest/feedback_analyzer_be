const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const { connection } = require("./config/db")

app.get('/', (req, res) => {
    res.send('Welcome');
});

app.use('/api/users', require('./routes/user'));
app.use('/api/feedbacks', require('./routes/feedback'));
app.use('/api/integrations', require('./routes/integration'));


app.listen(8080, async () => {
    try {
        await connection;
        console.log("DB is connected")
    }
    catch (error) {
        console.log("DB is not connected", error)
    }
    console.log(`Server running on port: 8080`);
});

