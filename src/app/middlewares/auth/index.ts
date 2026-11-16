import GoogleStateMiddleware from "./auth-google-state.js"

const Auth = {
  GoogleState: new GoogleStateMiddleware(),
}

export default Auth
