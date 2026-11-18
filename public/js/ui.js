export function showNotice(message, type = "error", target = "notice") {
  const el = document.getElementById(target)
  if (!el) return
  el.textContent = message
  el.className = `notice ${type}`
  el.hidden = false
}
export function clearNotice(target = "notice") {
  const el = document.getElementById(target)
  if (el) {
    el.hidden = true
    el.textContent = ""
    el.className = "notice"
  }
}
export function setBusy(button, busy, label = "Please wait…") {
  if (!button) return
  if (busy) {
    button.dataset.originalText = button.textContent
    button.textContent = label
    button.disabled = true
  } else {
    button.textContent = button.dataset.originalText || button.textContent
    button.disabled = false
  }
}
export function formData(form) {
  return Object.fromEntries(new FormData(form).entries())
}
export function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
export function redirect(path) {
  window.location.assign(path)
}
