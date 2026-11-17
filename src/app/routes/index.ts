import { IRoute } from "@/types/app.js"
import Auth from "./auth/index.js"
import User from "./user/index.js"
import Post from "./post/index.js"

const routes: IRoute[] = [
  ...Object.values(Auth),
  ...Object.values(User),
  ...Object.values(Post),
]

export default routes
