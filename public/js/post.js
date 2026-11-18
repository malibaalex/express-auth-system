import { api, messageOf, unwrapUser } from "./api.js"
import { showNotice, redirect } from "./ui.js"

const root = document.querySelector("#post-detail")
const id = new URLSearchParams(location.search).get("id")

if (!id) {
  showNotice("No post was specified.")
  root.innerHTML =
    '<a class="button secondary" href="/app/posts.html">Back to posts</a>'
} else {
  const [me, result] = await Promise.all([
    api.get("/api/auth/me"),
    api.get(`/api/posts/${encodeURIComponent(id)}`),
  ])
  if (!me.ok || !unwrapUser(me.body)?.userId) redirect("/app/")
  else if (!result.ok) {
    showNotice(messageOf(result, "Post not found."))
    root.innerHTML =
      '<a class="button secondary" href="/app/posts.html">Back to posts</a>'
  } else {
    const user = unwrapUser(me.body)
    const post = result.body?.data?.post ?? result.body?.post
    if (!post?.id) {
      showNotice("The server returned an unexpected post response.")
    } else {
      const own = post.authorId === user.userId
      const ownership = own
        ? '<div class="ownership-explanation">This post belongs to your account. You can edit its content or delete it.</div>'
        : '<div class="ownership-explanation">This post belongs to another author. You can read it, but editing and deleting are reserved for its owner.</div>'
      root.innerHTML = `<a class="back-link" href="/app/posts.html">← All posts</a><p class="eyebrow">POST</p><h1>${escapeHtml(post.title)}</h1><div class="post-meta">Created ${formatDate(post.createdAt)}${post.updatedAt && post.updatedAt !== post.createdAt ? ` · Updated ${formatDate(post.updatedAt)}` : ""}</div><div class="post-content">${escapeHtml(post.content)}</div>${ownership}${own ? `<div class="detail-actions"><a class="button primary" href="/app/post-form.html?id=${encodeURIComponent(post.id)}">Edit post</a><button id="delete-post" class="button danger" type="button">Delete post</button></div>` : ""}`
      document
        .querySelector("#delete-post")
        ?.addEventListener("click", async (event) => {
          if (!confirm(`Delete “${post.title}”? This cannot be undone.`)) return
          const button = event.currentTarget
          button.disabled = true
          button.textContent = "Deleting…"
          const deleted = await api.delete(
            `/api/posts/${encodeURIComponent(post.id)}`,
          )
          if (deleted.ok) redirect("/app/posts.html")
          else {
            button.disabled = false
            button.textContent = "Delete post"
            showNotice(
              messageOf(
                deleted,
                "The post could not be deleted. You can only delete posts you own.",
              ),
            )
          }
        })
    }
  }
}

document.querySelector("#logout").addEventListener("click", async () => {
  await api.post("/api/auth/logout", {}, { retry: false })
  redirect("/app/")
})
function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  )
}
function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
}
