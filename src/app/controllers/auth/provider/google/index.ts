import GoogleCallbackController from "./google-callback.js"
import GoogleRedirectController from "./google-redirect.js"

const Google = {
  Redirect: new GoogleRedirectController(),
  Callback: new GoogleCallbackController(),
}

export default Google
