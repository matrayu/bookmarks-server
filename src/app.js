require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const winston = require('winston')
const { NODE_ENV } = require('./config')

const app = express()

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'info.log' })
    ]
});

if (NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

app.use(morgan(morganOption))
app.use(cors())
app.use(helmet())

const bookmarks = {
    id: 1,
    title: "Bookmark Title 1",
    url: "bookmark1.url",
    description: "Bookmark1 description",
    rating: 5
};
    

app.use(function validateBearerToken(req, res, next) {
    const apiToken = process.env.API_TOKEN;
    const authToken = req.get('Authorization')

    if (!authToken || authToken.split(' ')[1] !== apiToken) {
        logger.error(`Unauthorized request to path: ${req.path}`);
        return res.status(401).json({ error: 'Unauthorized request' });
    }
    next()
})

app.get('/', (req, res) => {
    res.send('Hello, boilerplate!')
})

app.get('/bookmarks', (req, res) => {
    res.json(bookmarks)
})

app.get('/bookmarks/:id', (req, res) => {
    const { id } = req.params;
    const bookmark = bookmarks.find(bm => {
        console.log(bm)
        bm.id === id});
    console.log(bookmark)
    
    if (!bookmark) {
        logger.error(`Bookmark with id ${id} not found`);
        return res
            .status(404)
            .send('Bookmark not found');
    }

    res.json(bookmark);
})

app.use((error, req, res, next) => {
    let response
    if (NODE_ENV === 'production') {
        response = { error: { message: 'server error' }}
    } else {
        response = { error }
    }
    res.status(500).json(response)
})

module.exports = app