import PostCreateController from "./post-create.js"
import PostDeleteController from "./post-delete.js"
import PostGetController from "./post-get.js"
import PostListController from "./post-list.js"
import PostUpdateController from "./post-update.js"

const Post = {
  Create: new PostCreateController(),
  Update: new PostUpdateController(),
  Get: new PostGetController(),
  List: new PostListController(),
  Delete: new PostDeleteController(),
}

export default Post
