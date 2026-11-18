import { api, messageOf, unwrapUser } from "./api.js"
import { showNotice, setBusy, formData, redirect } from "./ui.js"
const form = document.querySelector("#verify-form")
const resend = document.querySelector("#resend-form")
const emailInput = form.elements.email
const resendEmail = resend.elements.email
const pending = sessionStorage.getItem("auth.pendingEmail") || ""
emailInput.value = pending
resendEmail.value = pending
emailInput.addEventListener("input", () => {
  resendEmail.value = emailInput.value
})
form.addEventListener("submit", async (event) => {
  event.preventDefault()
  const values = formData(form)
  if (!/^\d{6}$/.test(values.code))
    return showNotice("Enter the six-digit verification code.")
  const button = form.querySelector("button")
  setBusy(button, true)
  const result = await api.post("/api/auth/otp/verify", {
    email: values.email.trim(),
    code: values.code,
  })
  setBusy(button, false)
  if (result.ok) {
    sessionStorage.removeItem("auth.pendingEmail")
    if (unwrapUser(result.body)?.userId) return redirect("/app/app.html")
    return redirect("/app/app.html")
  }
  showNotice(
    messageOf(
      result,
      "That code is invalid or expired. Request a new one if needed.",
    ),
  )
})
resend.addEventListener("submit", async (event) => {
  event.preventDefault()
  const email = emailInput.value.trim()
  if (!email) return showNotice("Enter your email address first.")
  const button = resend.querySelector("button")
  setBusy(button, true)
  const result = await api.post("/api/auth/otp/send", { email })
  setBusy(button, false)
  if (result.ok)
    showNotice(
      messageOf(
        result,
        "If the account is pending verification, a code was sent.",
      ),
      "success",
    )
  else showNotice(messageOf(result))
})
