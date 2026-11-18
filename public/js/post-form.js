import { api, messageOf, unwrapUser } from "./api.js"
import { showNotice, setBusy, redirect } from "./ui.js"

const form = document.querySelector("#post-form")
const button = form.querySelector('button[type="submit"]')
const params = new URLSearchParams(location.search)
const id = params.get("id")
const title = document.querySelector("#form-title")
const eyebrow = document.querySelector("#form-eyebrow")
const counter = document.querySelector("#content-count")
const content = form.elements.content

const me = await api.get("/api/auth/me")
if (!me.ok || !unwrapUser(me.body)?.userId) {
  redirect("/app/")
} else if (id) {
  const user = unwrapUser(me.body)
  title.textContent = "Edit your post"
  eyebrow.textContent = "YOUR CONTENT"
  button.textContent = "Save changes"
  const result = await api.get(`/api/posts/${encodeURIComponent(id)}`)
  const post = result.body?.data?.post ?? result.body?.post
  if (!result.ok || !post?.id) {
    showNotice(messageOf(result, "We couldn't load this post."))
    button.disabled = true
  } else if (post.authorId !== user.userId) {
    showNotice(
      "This post belongs to another author. You can read it, but only its owner can make changes.",
    )
    button.disabled = true
    form.querySelectorAll("input, textarea").forEach((field) => {
      field.disabled = true
    })
  } else {
    form.elements.title.value = post.title ?? ""
    content.value = post.content ?? ""
    updateCount()
  }
} else {
  updateCount()
}

content.addEventListener("input", updateCount)
form.addEventListener("submit", async (event) => {
  event.preventDefault()
  const payload = {
    title: form.elements.title.value.trim(),
    content: content.value.trim(),
  }
  if (!payload.title || payload.title.length > 150)
    return showNotice("Title is required and must be at most 150 characters.")
  if (!payload.content || payload.content.length > 10000)
    return showNotice(
      "Content is required and must be at most 10,000 characters.",
    )

  setBusy(button, true, id ? "Saving changes…" : "Creating post…")
  const result = id
    ? await api.patch(`/api/posts/${encodeURIComponent(id)}`, payload)
    : await api.post("/api/posts/create", payload)
  setBusy(button, false)

  if (result.ok) {
    const post = result.body?.data?.post ?? result.body?.post
    if (post?.id) redirect(`/app/post.html?id=${encodeURIComponent(post.id)}`)
    else redirect("/app/posts.html")
  } else {
    showNotice(
      messageOf(
        result,
        id
          ? "Your changes could not be saved."
          : "Your post could not be created.",
      ),
    )
  }
})

document.querySelector("#logout").addEventListener("click", async () => {
  await api.post("/api/auth/logout", {}, { retry: false })
  redirect("/app/")
})
function updateCount() {
  counter.textContent = `${content.value.length.toLocaleString()} / 10,000`
}
