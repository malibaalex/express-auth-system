import IdValidator from "@/app/validators/validator-id.js"
import Auth from "./auth/index.js"
import z from "zod"
import User from "./user/index.js"
import Post from "./post/index.js"

const Id = new IdValidator()

const Validators = { Id, Auth, User, Post }

export type ValidatorTypes = {
  Id: z.infer<typeof Id.schema>

  Auth: {
    SignUp: z.infer<typeof Auth.SignUp.schema>
    SignIn: z.infer<typeof Auth.SignIn.schema>
    Otp: {
      Send: z.infer<typeof Auth.Otp.Send.schema>
      Verify: z.infer<typeof Auth.Otp.Verify.schema>
    }
    Password: {
      Forgot: z.infer<typeof Auth.Password.Forgot.schema>
      Reset: z.infer<typeof Auth.Password.Reset.schema>
    }
  }

  User: {
    Profile: {
      Update: z.infer<typeof User.Profile.Update.schema>
    }
  }

  Post: {
    Create: z.infer<typeof Post.Create.schema>
    Update: z.infer<typeof Post.Update.schema>
    List: z.infer<typeof Post.List.schema>
  }
}

export default Validators
