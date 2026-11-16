import Provider from "./provider/index.js"

const Auth = {
  GoogleCallback: Provider.Google.Callback,
  GoogleRedirect: Provider.Google.Redirect,
}

export default Auth
