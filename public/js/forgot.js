import { api, messageOf } from "./api.js"
import { showNotice, setBusy, formData } from "./ui.js"

const form = document.querySelector("#forgot-form")
const button = form.querySelector("button[type=submit]")
const continueButton = document.querySelector("#continue-reset")

form.addEventListener("submit", async (event) => {
  event.preventDefault()
  const email = formData(form).email.trim()
  if (!email) return showNotice("Enter the email address for your account.")

  setBusy(button, true, "Sending code…")
  const result = await api.post("/api/auth/password/forgot", { email })
  setBusy(button, false)

  if (result.ok) {
    sessionStorage.setItem("auth.resetEmail", email)
    showNotice(
      messageOf(
        result,
        "If an account exists for this email, a reset code was sent.",
      ),
      "success",
    )
    continueButton.hidden = false
    form.hidden = true
  } else {
    showNotice(
      messageOf(result, "We couldn't process that request. Please try again."),
    )
  }
})
