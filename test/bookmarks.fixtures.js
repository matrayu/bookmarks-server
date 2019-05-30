function makeBookmarksArray() {
    return [
        {
            "id" : 1,
            "title" : "Thinkful",
            "url" : "http:\/\/www.thinkful.com",
            "description" : "Online coding bootcamp",
            "rating" : "5"
        },
        {
            "id" : 2,
            "title" : "Google",
            "url" : "http:\/\/www.google.com",
            "description" : "Internet Search",
            "rating" : "5"
        },
        {
            "id" : 3,
            "title" : "NBA",
            "url" : "http:\/\/www.nba.com",
            "description" : "National Basketball Association",
            "rating" : "5"
        }   
    ]
}

function makeMaliciousBookmark() {
    const maliciousBookmark = {
        id: 911,
        title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        url: 'http:\/\/www.nba.com',
        description: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
        rating: 3
    } 
    const maliciousBookmarkPatch = {
        title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        description: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.'
    }
    const expectedBookmark = {
        ...maliciousBookmark,
        rating: '3',
        title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        description: 'Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.',
    }
    return {
        maliciousBookmark,
        expectedBookmark, 
        maliciousBookmarkPatch
    }
}

module.exports = { 
    makeBookmarksArray,
    makeMaliciousBookmark,
}




