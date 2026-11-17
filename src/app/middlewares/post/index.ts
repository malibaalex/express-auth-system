import PostWriteAccess from "./post-write-access.js"

const Post = {
  WriteAccess: (own: string, any: string) => new PostWriteAccess(own, any),
}

export default Post
