import passport from "passport"
import GoogleStrategy from "./strategie-google.js"

const Google = new GoogleStrategy()

passport.use(Google.name, Google.instance)

const Strategies = {
  Google,
}

export default Strategies
