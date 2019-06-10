const express = require('express');
const valid = require('validator');
const logger = require('../logger');
const BookmarksService = require('./bookmarks-service');
const xss = require('xss');
const path = require('path');

const bookmarksRouter = express.Router();
const jsonParser = express.json();

const sterileBookmark = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title),
    description: xss(bookmark.description),
    url: bookmark.url,
    rating: bookmark.rating,
})

bookmarksRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getAllBookmarks(knexInstance)
            .then(bookmarks => {
                res
                    .json(bookmarks.map(sterileBookmark))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const knexInstance = req.app.get('db')
        //get data from body
        const { title, url, description, rating } = req.body; 
        //create new bookmark from request body
        const newBookmark = { title, url, rating, description }; 
        //check for required fields and send an error if missing
        for (const [ key, value ] of Object.entries(newBookmark)) {
            if (value == null) {
                logger.error(`${key} value is empty`)
                return res
                    .status(400)
                    .send({
                        error: `Missing ${key} in the request body`
                    })
            }
        }

        const urlTest = valid.isURL(url)

        //if the url is not valid log and return an error
        if (!urlTest) {
            logger.error('Valid Url is required');
            return res
                .status(400)
                .send('Valid Url is required');
        }
 
        //if the rating is not between 1 & 5 log and return an error
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            logger.error(`Invalid rating '${rating}' supplied`);
            return res
                .status(400)
                .send('Rating must be between 1 - 5');
        }

        BookmarksService.insertBookmark(knexInstance, newBookmark)
            .then(bookmark => {
                //log that a bookmark was created along with its id
                logger.info(`Bookmark with id ${bookmark.id} created`);
                //return a response with a status, location, and json payload
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
                    .json(sterileBookmark(bookmark));
            })
            .catch(next)
    });

bookmarksRouter
    .route('/:bookmark_id')
    .all((req, res, next) => {
        const knexInstance = req.app.get('db')
        const { bookmark_id } = req.params;

        BookmarksService.getById(knexInstance, bookmark_id)
            .then(bookmark => {
                if (!bookmark) {
                    logger.error(`Bookmark with id ${bookmark_id} not found`);
                    return res
                        .status(404)
                        .json({
                            error: `Bookmark with id ${bookmark_id} not found`
                        }
                    )
                }
                res.bookmark = bookmark
                next()
            })
            .catch(next)
        
    })
    .get((req, res, next) => {
        res.json(sterileBookmark(res.bookmark))
    })
    .delete((req, res, next) => {
        const knexInstance = req.app.get('db');
        const { bookmark_id } = req.params;

        BookmarksService.deleteBookmark(knexInstance, bookmark_id)
            .then(() => {
                logger.info(`Bookmark with id ${bookmark_id} deleted`);
                res
                    .status(204)
                    .end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        /* res.status(204).end() */
        const knexInstance = req.app.get('db');
        const { bookmark_id } = req.params;
        const { title, url, description, rating } = req.body;
        const bookmarkToPatch = { title, url, description, rating };

        const numOfValue = Object.values(bookmarkToPatch).filter(Boolean).length

        if (numOfValue === 0) {
            logger.error(`Request body must contain either 'title', 'url', 'rating' or 'description'`)
            return res
                .status(400)
                .json({
                    error: `Request body must contain either 'title', 'url', 'rating' or 'description'`
                })
        }

        BookmarksService.patchBookmark(knexInstance, bookmark_id, bookmarkToPatch)
            .then(bookmark => {
                logger.info(`Bookmark with id ${bookmark_id} has been patched`)
                res
                    .status(204)
                    .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
                    .end()
            })
            .catch(next)
    })

module.exports = bookmarksRouter;
