module.exports = class PostInstagram {
    constructor(data, nbFollowers) {
        this.id = data.node.id;
        this.type = data.node.__typename;
        this.shortCode = data.node.shortcode; // https://www.instagram.com/p/{shortCode}/
        this.isVideo = data.node.is_video;
        this.timeStamp = data.node.taken_at_timestamp;
        this.lastCheck = Math.trunc(Date.now() / 1000);
        this.nbLikes = data.node.edge_liked_by.count;
        this.nbComments = data.node.edge_media_to_comment.count;
        this.rating = this.getRating(nbFollowers);
    }

    getRating(nbFollowers) {
        return (this.nbLikes + this.nbComments) / ((Math.trunc(Date.now() / 1000) - this.timeStamp) + nbFollowers);
    }
}