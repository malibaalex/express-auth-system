import Auth from "./auth/index.js"
import { Authz } from "./authz/index.js"
import Post from "./post/index.js"

const Middlewares = {
  Auth,
  Authz,
  Post,
}

export default Middlewares
