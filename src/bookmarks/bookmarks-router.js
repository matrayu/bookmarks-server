const express = require('express');
const uuid = require('uuid/v4');
const logger = require('../logger');
const { bookmarks } = require('../store');

const bookmarksRouter = express.Router();
const bodyParser = express.json();

bookmarksRouter
    .route('/bookmarks')
    .get((req, res) => {
        res.json(bookmarks)
    })
    .post(bodyParser, (req, res) => {
        //get data from body
        const { title, url, description, rating } = req.body;

        //if there's no title, log and return an error
        if (!title) {
            logger.error('Title is required');
            return res
                .status(400)
                .send('Invalid data');
        }

        //if there's no url log and return an error
        if (!url) {
            logger.error('Url is required');
            return res
                .status(400)
                .send('Invalid data');
        }

        const re = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;
        const urlTest = re.test(url)

        if (!urlTest) {
            logger.error('Valid Url is required');
            return res
                .status(400)
                .send('Invalid data');
        }

        if (rating > 5 || rating === 0) {
            logger.error('Rating must be between 1 - 5');
            return res
                .status(400)
                .send('Invalid data');
        }

        //if title and url exist, create an id
        const id = uuid();

        //construct the bookmark object
        const bookmark = {
            id,
            title,
            url,
            description,
            rating
        };

        //add the bookmark to the exisiting bookmarks
        bookmarks.push(bookmark);

        //log that a bookmark was created along with its id
        logger.info(`Bookmark with id ${id} created`);

        //return a response with a status, location, and json payload
        res
            .status(201)
            .location(`http://localhost:8000/bookmarks/${id}`)
            .json(bookmark);

    });

bookmarksRouter
    .route('/bookmarks/:id')
    .get((req, res) => {
        const { id } = req.params;
        const bookmark = bookmarks.find(bm => bm.id == id);
        
        if (!bookmark) {
            logger.error(`Bookmark with id ${id} not found`);
            return res
                .status(404)
                .send('Bookmark not found');
        }

        res.json(bookmark);
    })
    .delete((req, res) => {
        const { id } = req.params;
        const bookmarkIndex = bookmarks.findIndex(bm => bm.id == id);

        if (bookmarkIndex === -1) {
            logger.error(`Bookmark with id ${id} not found`);
            return res
                .status(404)
                .send('Not found');
        }

        bookmarks.splice(bookmarkIndex, 1);

        logger.info(`Bookmark with id ${id} deleted`);

        res.status(204).end();
    });

module.exports = bookmarksRouter;