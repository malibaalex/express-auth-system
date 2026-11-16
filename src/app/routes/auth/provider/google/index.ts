import GoogleCallbackRoute from "./google-callback.js"
import GoogleRedirectRoute from "./google-redirect.js"

const path = "/api/google"

const Google = {
  Callback: new GoogleCallbackRoute(path),
  Redirect: new GoogleRedirectRoute(path),
}

export default Google
