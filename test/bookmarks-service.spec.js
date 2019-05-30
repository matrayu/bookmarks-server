const { makeBookmarksArray, makeMaliciousBookmark } = require('./bookmarks.fixtures')
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
        const testBookmarks = makeBookmarksArray()

        beforeEach('insert bookmarks', () => {
            return db
                .into('bookmarks')
                .insert(testBookmarks)
        })

        it('Responses with a 401 Unauthorized for GET /api/bookmarks', () => {
            return supertest(app)
                .get('/api/bookmarks')
                .expect(401, { error: `Unauthorized request` })
        })
    })

    
    describe(`GET /api/bookmarks`, () => {
        context('Given no bookmarks', () => {
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/api/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, [])
            })
        })

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })
    
            it(`responds with 200 and all of the bookmarks`, () => {
                return supertest(app)
                    .get('/api/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, testBookmarks)
            })
        })
        
        context('Given an XXS attack bookmark', () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

            beforeEach('insert malicious article', () => {
                return db
                    .into('bookmarks')
                    .insert([ maliciousBookmark ])
            })

            it('removes XXS attack content', () => {
                return supertest(app)
                    .get(`/api/bookmarks`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].title).to.eql(expectedBookmark.title)
                        expect(res.body[0].description).to.eql(expectedBookmark.description)
                    })
            })

        })

        context('Given an XXS attack bookmark', () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

            beforeEach('insert malicious bookmark', () => {
                return db
                    .into('bookmarks')
                    .insert([ maliciousBookmark ])
            })

            it('removes XXS attack content', () => {
                return supertest(app)
                    .get(`/api/bookmarks`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].title).to.eql(expectedBookmark.title)
                        expect(res.body[0].description).to.eql(expectedBookmark.description)
                    })
            })
        })
    })

    describe(`GET /api/bookmarks/:bookmark_id`, () => {
        context('Given no bookmarks', () => {
            it('responds with a 404 and error', () => {
                const bookmarkId = 123456
                return supertest(app)
                    .get(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { 
                        error: `Bookmark with id ${bookmarkId} not found`
                    })
            })
        })

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it('responds with 200 and the specified bookmark', () => {
                const bookmarkId = 2
                const expectedBookmark = testBookmarks[bookmarkId - 1]
                return supertest(app)
                    .get(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedBookmark)
            })
        })

        context('Given an XXS attack bookmark', () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

            beforeEach('insert malicious article', () => {
                return db
                    .into('bookmarks')
                    .insert([ maliciousBookmark ])
            })

            it('removes XXS attack content', () => {
                return supertest(app)
                    .get(`/api/bookmarks/${maliciousBookmark.id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql(expectedBookmark.title)
                        expect(res.body.description).to.eql(expectedBookmark.description)
                    })
            })

        })
    })

    describe('POST /api/bookmarks', () => {
        it('creates a new bookmark and responses with a 201', () => {
            const newBookmark = {
                title: 'New Title',
                url: 'http://www.newurl.com',
                description: 'New description',
                rating: 5,
            };
            return supertest(app)
                .post('/api/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send(newBookmark)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newBookmark.title)
                    expect(res.body.url).to.eql(newBookmark.url)
                    expect(res.body.description).to.eql(newBookmark.description)
                    expect(res.body).to.have.property('id')
                    const expected = newBookmark.rating
                    const actual = parseInt(res.body.rating)
                    expect(actual).to.eql(expected)
                })
                //used an implicit return inside the then block so that 
                //Mocha knows to wait for both requests to resolve
                .then(postRes => 
                    supertest(app)
                        .get(`/api/bookmarks/${postRes.body.id}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(postRes.body)
                )
        })

        const requiredFields = ['title', 'url', 'rating'];

        requiredFields.forEach(field => {
            const newBookmark = {
                title: 'New Title',
                url: 'http://www.newurl.com',
                rating: 5,
            }

            it(`responds with 400 and an error message when the ${field} is missing`, () => {
                delete newBookmark[field];

                return supertest(app)
                    .post('/api/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(newBookmark)
                    .expect(400, {
                        error: `Missing ${field} in the request body`
                    })
            })
        })

        context('Given an XXS attack bookmark', () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

            beforeEach('insert malicious bookmark', () => {
                return db
                    .into('bookmarks')
                    .insert([ maliciousBookmark ])
            })

            it('removes XXS attack content', () => {
                return supertest(app)
                    .post(`/api/bookmarks`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(maliciousBookmark)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.title).to.eql(expectedBookmark.title)
                        expect(res.body.description).to.eql(expectedBookmark.description)
                    })
            })
        })
    })

    describe('DELETE /api/bookmarks/:bookmark_id', () => {
        context('Given no bookmark exists', () => {
            it('Responds with a 404 error', () => {
                const bookmarkId = 12345;
                return supertest(app)
                    .delete(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: `Bookmark with id ${bookmarkId} not found`
                    })
            })
        })

        context("Given there are bookmarks in the database", () => {
            const testBookmarks = makeBookmarksArray();

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it('Response with a 204 and removes the bookmark', () => {
                const idToRemove = 2
                const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id != idToRemove)
                return supertest(app)
                    .delete(`/api/bookmarks/${idToRemove}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/bookmarks`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedBookmarks))
            })
        })
    })

    describe('PATCH /api/bookmarks/:bookmarks_id', () => {
        context('Given there are no bookmarks found', () => {
            it('responds with a 404 and error', () => {
                const bookmarkId = 123456
                return supertest(app)
                    .get(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { 
                        error: `Bookmark with id ${bookmarkId} not found`
                    })
            })
        })

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it('responds with 201 and patches the specified bookmark', () => {
                const bookmarkIdToPatch = 2;
                
                const patchedBookmark = {
                    title: 'Patched Title',
                    url: "http://www.patchedUrl.com",
                    description: "Patched Description"
                };

                const expectedBookmark = {
                    ...testBookmarks[bookmarkIdToPatch - 1],
                    ...patchedBookmark
                }

                return supertest(app)
                    .patch(`/api/bookmarks/${bookmarkIdToPatch}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(patchedBookmark)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/bookmarks/${bookmarkIdToPatch}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedBookmark)
                    )
            })
        })

        context('Given an XXS attack bookmark', () => {
            const { maliciousBookmark, maliciousBookmarkPatch, expectedBookmark } = makeMaliciousBookmark();

            beforeEach('insert malicious bookmark patch', () => {
                return db
                    .into('bookmarks')
                    .insert([ maliciousBookmark ])
            })

            it('removes XXS attack content', () => {
                const idToPatch = 911
                return supertest(app)
                    .patch(`/api/bookmarks/${idToPatch}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(maliciousBookmarkPatch)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/bookmarks/${idToPatch}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedBookmark)
                    )
            })
        })
    })
})  