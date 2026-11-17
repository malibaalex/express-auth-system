import PostCreateValidator from "./post-create.js"
import PostListValidator from "./post-list.js"
import PostUpdateValidator from "./post-update.js"

const Post = {
  Create: new PostCreateValidator(),
  Update: new PostUpdateValidator(),
  List: new PostListValidator(),
}

export default Post
