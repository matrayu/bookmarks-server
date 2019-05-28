const express = require('express');
const uuid = require('uuid/v4');
const valid = require('validator');
const logger = require('../logger');
/* const { bookmarks } = require('../store'); */
const BookmarksService = require('../bookmarks-service');

const bookmarksRouter = express.Router();
const bodyParser = express.json();

bookmarksRouter
    .route('/bookmarks')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getAllBookmarks(knexInstance)
            .then(bookmarks => {
                res.json(bookmarks)
            })
            .catch(next)
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

        const urlTest = valid.isURL(url)

        //if the url is not valid log and return an error
        if (!urlTest) {
            logger.error('Valid Url is required');
            return res
                .status(400)
                .send('Invalid data');
        }

        //if the rating is not between 1 & 5 log and return an error
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            logger.error(`Invalid rating '${rating}' supplied`);
            return res
                .status(400)
                .send('Rating must be between 1 - 5');
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
        /* bookmarks.push(bookmark); */

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
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        const { id } = req.params;
        /* const bookmark = bookmarks.find(bm => bm.id == id);
        console.log(bookmark, )
        if (!bookmark) {
            logger.error(`Bookmark with id ${id} not found`);
            return res
                .status(404)
                .send(`Bookmark with id ${id} not found`);
        } */
        BookmarksService.getById(knexInstance, id)
            .then(bookmark => {
                if (!bookmark) {
                    logger.error(`Bookmark with id ${id} not found`);
                    return res.status(404).json({
                        error: {
                            message: `Bookmark with id ${id} not found`
                        }
                    });
                }
                res.json(bookmark);
            })
            .catch(next)
        
    })
    .delete((req, res) => {
        const { id } = req.params;
        const bookmarkIndex = bookmarks.findIndex(bm => bm.id == id);

        if (bookmarkIndex === -1) {
            logger.error(`Bookmark with id ${id} not found`);
            return res
                .status(404)
                .send(`Bookmark with id ${id} not found`);
        }

        bookmarks.splice(bookmarkIndex, 1);

        logger.info(`Bookmark with id ${id} deleted`);

        res.status(204).end();
    });

module.exports = bookmarksRouter;
