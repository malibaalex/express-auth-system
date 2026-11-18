import { api, unwrapUser, messageOf } from "./api.js"
import { showNotice, setBusy, formData, redirect } from "./ui.js"
const form = document.querySelector("#login-form")
const button = form.querySelector("button[type=submit]")
const params = new URLSearchParams(location.search)
if (params.has("error"))
  showNotice("Google sign-in could not be completed. Please try again.")
const me = await api.get("/api/auth/me")
if (me.ok && unwrapUser(me.body)?.userId) redirect("/app/app.html")
form.addEventListener("submit", async (event) => {
  event.preventDefault()
  const { email, password } = formData(form)
  if (password.length < 8 || password.length > 128)
    return showNotice("Password must be between 8 and 128 characters.")
  setBusy(button, true)
  const result = await api.post("/api/auth/email/sign-in", {
    email: email.trim(),
    password,
  })
  setBusy(button, false)
  if (result.ok) return redirect("/app/app.html")
  if (result.status === 403)
    showNotice(
      messageOf(
        result,
        "Your email may not be verified yet. Use the verification link below to enter your code.",
      ),
    )
  else showNotice(messageOf(result, "Invalid email or password."))
})
