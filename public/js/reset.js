import { api, messageOf } from "./api.js"
import { showNotice, setBusy, formData, redirect } from "./ui.js"

const form = document.querySelector("#reset-form")
const button = form.querySelector("button[type=submit]")
const requestedEmail = sessionStorage.getItem("auth.resetEmail")

// The reset step follows a successful forgot-password request in this browser session.
if (!requestedEmail) {
  redirect("/app/forgot.html")
} else {
  form.elements.email.value = requestedEmail
  form.elements.email.readOnly = true

  form.addEventListener("submit", async (event) => {
    event.preventDefault()
    const values = formData(form)
    if (!/^\d{6}$/.test(values.code))
      return showNotice("Enter the six-digit reset code from your email.")
    if (values.password.length < 8 || values.password.length > 128)
      return showNotice("Password must be between 8 and 128 characters.")
    if (values.password !== values.confirmPassword)
      return showNotice("The passwords do not match.")

    setBusy(button, true, "Updating password…")
    const result = await api.post("/api/auth/password/reset", {
      email: requestedEmail,
      code: values.code,
      password: values.password,
    })
    setBusy(button, false)

    if (result.ok) {
      sessionStorage.removeItem("auth.resetEmail")
      showNotice(
        messageOf(result, "Password updated. Please sign in."),
        "success",
      )
      setTimeout(() => redirect("/app/"), 1100)
    } else {
      showNotice(
        messageOf(
          result,
          "The reset code is invalid or expired. Request a new one.",
        ),
      )
    }
  })
}
