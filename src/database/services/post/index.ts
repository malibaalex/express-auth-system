import CreatePostService from "./post-create.js"
import FindPostByIdService from "./post-find-by-id.js"
import ListPostsService from "./post-list.js"
import UpdatePostService from "./post-update.js"
import DeletePostService from "./post-delete.js"

const Post = {
  Create: new CreatePostService(),
  FindById: new FindPostByIdService(),
  List: new ListPostsService(),
  Update: new UpdatePostService(),
  Delete: new DeletePostService(),
}

export default Post
