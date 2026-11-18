import { api, messageOf } from "./api.js"
import { showNotice, setBusy, formData, redirect } from "./ui.js"
const form = document.querySelector("#signup-form")
const button = form.querySelector("button")
form.addEventListener("submit", async (event) => {
  event.preventDefault()
  const values = formData(form)
  if (values.password.length < 8 || values.password.length > 128)
    return showNotice("Password must be between 8 and 128 characters.")
  setBusy(button, true)
  const payload = {
    email: values.email.trim(),
    password: values.password,
    ...(values.fullName.trim() ? { fullName: values.fullName.trim() } : {}),
  }
  const result = await api.post("/api/auth/email/sign-up", payload)
  setBusy(button, false)
  if (result.ok) {
    sessionStorage.setItem("auth.pendingEmail", payload.email)
    redirect("/app/verify.html")
    return
  }
  showNotice(
    messageOf(result, "We couldn't create your account. Please try again."),
  )
})
