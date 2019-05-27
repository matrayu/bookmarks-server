const fixtures = require('./bookmarks.fixtures')
const knex = require('knex');
const app = require('../src/app');

describe(`Bookmarks Endpoints`, function() {
    let db;

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('bookmarks').truncate())
    
    afterEach('cleanup', () => db('bookmarks').truncate())

    describe(`Unauthorized requests`, () => {
        const testBookmarks = fixtures.makeBookmarksArray()

        beforeEach('insert bookmarks', () => {
            return db
                .into('bookmarks')
                .insert(testBookmarks)
        })

        it('Responses with a 401 Unauthorized for GET /bookmarks', () => {
            return supertest(app)
                .get('/bookmarks')
                .expect(401, { error: `Unauthorized request` })
        })
    })

    
    describe(`GET /bookmarks`, () => {
        context('Given no bookmarks', () => {
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
            })
        })

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = fixtures.makeBookmarksArray();

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })
    
            it(`responds with 200 and all of the bookmarks`, () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, testBookmarks)
            })
        }) 
    })


    describe(`GET /bookmarks/:bookmarks_id`, () => {
        context('Given no articles', () => {
            it('responds with a 404 and error', () => {
                const bookmarkId = 123456
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { 
                        error: {
                            message: `Bookmark with id ${bookmarkId} not found`
                        }
                    })
            })
        })

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = fixtures.makeBookmarksArray();

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it('responds with 200 and the specified bookmark', () => {
                const bookmarkId = 2
                const expectedBookmark = testBookmarks[bookmarkId - 1]
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedBookmark)
            })
        })
    })
})  