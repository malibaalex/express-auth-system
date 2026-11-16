import IdValidator from "@/app/validators/validator-id.js"
import Auth from "./auth/index.js"
import z from "zod"

const Id = new IdValidator()

const Validators = { Id, Auth }

export type ValidatorTypes = {
  Auth: {
    SignUp: z.infer<typeof Auth.SignUp.schema>
    SignIn: z.infer<typeof Auth.SignIn.schema>
    Otp: {
      Send: z.infer<typeof Auth.Otp.Send.schema>
      Verify: z.infer<typeof Auth.Otp.Verify.schema>
    }
  }
}

export default Validators
