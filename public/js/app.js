import { api, unwrapUser, messageOf } from "./api.js"
import { showNotice, redirect } from "./ui.js"

const profile = document.querySelector("#profile")
const adminNote = document.querySelector("#admin-note")
const result = await api.get("/api/auth/me")

if (!result.ok) {
  showNotice(
    messageOf(result, "Your session has expired. Please sign in again."),
  )
  redirect("/app/")
} else {
  const user = unwrapUser(result.body)
  if (!user?.userId) {
    showNotice("We couldn't load your account details.")
    redirect("/app/")
  } else {
    const avatar = user.avatarUrl
      ? `<img class="avatar" src="${escapeAttr(user.avatarUrl)}" alt="" referrerpolicy="no-referrer">`
      : `<div class="avatar avatar-fallback" aria-hidden="true">${escapeHtml((user.fullName || user.email || "U").slice(0, 1).toUpperCase())}</div>`
    const roles = Array.isArray(user.roles) ? user.roles : []
    profile.innerHTML = `${avatar}<div><div class="profile-name">${escapeHtml(user.fullName || "Account")}</div><div class="profile-meta">${escapeHtml(user.email || "")}<br>${user.emailVerified ? "Email verified" : "Email not verified"}</div><div class="role-list">${roles.map((role) => `<span class="role">${escapeHtml(role)}</span>`).join("")}</div></div>`
    // This is an informational note only. No admin route or moderation action is exposed before the API exists.
    if (roles.includes("ADMIN")) adminNote.hidden = false
  }
}

document.querySelector("#logout").addEventListener("click", async (event) => {
  const button = event.currentTarget
  button.disabled = true
  const logout = await api.post("/api/auth/logout", {}, { retry: false })
  if (!logout.ok)
    showNotice(
      messageOf(
        logout,
        "Sign-out could not be confirmed. Returning to sign in.",
      ),
    )
  redirect("/app/")
})

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  )
}
function escapeAttr(value) {
  return escapeHtml(value)
}
