const BookmarksService = {
    getAllBookmarks(knex) {
        return knex.select('*').from('bookmarks')
    },
    insertBookmark(knex, newBookmark) {
        return knex
            .insert(newBookmark)
            .into('bookmarks')
            .returning('*')
            .then(rows => {
                return rows[0];
            });
    },
    getById(knex, id) {
        return knex('bookmarks')
            .where({ id })
            .first()
    },
    deleteBookmark(knex, id) {
        return knex('bookmarks')
            .where({ id })
            .delete()
    },
    patchBookmark(knex, id, patchedFields) {
        return knex('bookmarks')
            .where({ id })
            .update(patchedFields)
    },
}

module.exports = BookmarksService;