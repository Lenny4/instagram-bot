const PostInstagram = require('./postInstagram');

module.exports = class PageInstagram {
    // use "category_enum": "CAR",
    constructor(data) {
        this.id = data.entry_data.ProfilePage[0].graphql.user.id;
        this.nbPosts = data.entry_data.ProfilePage[0].graphql.user.edge_owner_to_timeline_media.count;
        this.nbFollowers = data.entry_data.ProfilePage[0].graphql.user.edge_followed_by.count;
        this.nbFollowing = data.entry_data.ProfilePage[0].graphql.user.edge_follow.count;
        this.postInstagrams = [];
        this.lastCheck = Math.trunc(Date.now() / 1000);
        this.category = data.entry_data.ProfilePage[0].graphql.user.category_enum;
        for (let post of data.entry_data.ProfilePage[0].graphql.user.edge_owner_to_timeline_media.edges) {
            const postInstagram = new PostInstagram(post, this.nbFollowers);
            this.postInstagrams.push(postInstagram);
        }
    }
};
