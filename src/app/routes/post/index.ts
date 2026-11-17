import PostCreateRoute from "./post-create.js"
import PostGetRoute from "./post-get.js"
import PostUpdateRoute from "./post-update.js"
import PostListRoute from "./post-list.js"
import PostDeleteRoute from "./post-delete.js"

const path = "/posts"

const Post = {
  Create: new PostCreateRoute(path),
  List: new PostListRoute(path),

  Update: new PostUpdateRoute(path),
  Get: new PostGetRoute(path),
  Delete: new PostDeleteRoute(path),
}

export default Post
