import { api, messageOf, unwrapUser } from "./api.js"
import { showNotice, redirect } from "./ui.js"

const list = document.querySelector("#posts-list")
const pageLabel = document.querySelector("#page-indicator")
const previous = document.querySelector("#previous")
const next = document.querySelector("#next")
const PAGE_SIZE = 10
let page = 1
let currentUser = null
let total = 0

const me = await api.get("/api/auth/me")
if (!me.ok || !unwrapUser(me.body)?.userId) {
  redirect("/app/")
} else {
  currentUser = unwrapUser(me.body)
  await loadPosts()
}

async function loadPosts() {
  list.setAttribute("aria-busy", "true")
  list.innerHTML =
    '<div class="empty-state"><span class="loading-dot" aria-hidden="true"></span><p>Loading posts…</p></div>'
  const result = await api.get(
    `/api/posts/list?page=${page}&pageSize=${PAGE_SIZE}`,
  )
  list.setAttribute("aria-busy", "false")

  if (!result.ok) {
    list.innerHTML = ""
    showNotice(messageOf(result, "We couldn't load posts."))
    if (result.status === 401) redirect("/app/")
    return
  }

  const data = result.body?.data ?? {}
  const items = Array.isArray(data.items) ? data.items : []
  total = Number(data.total ?? 0)
  pageLabel.textContent = `Page ${page} · ${total} ${total === 1 ? "post" : "posts"}`
  previous.disabled = page <= 1
  next.disabled = page * PAGE_SIZE >= total

  if (!items.length) {
    list.innerHTML = `<div class="empty-state"><h2>${page === 1 ? "No posts yet" : "No posts on this page"}</h2><p>${page === 1 ? "Start the workspace with a post of your own." : "Return to the previous page to see more posts."}</p>${page === 1 ? '<a class="button primary" href="/app/post-form.html">Write the first post</a>' : ""}</div>`
    return
  }

  list.innerHTML = items
    .map((post) => {
      const own = post.authorId === currentUser.userId
      const date = formatDate(post.createdAt)
      const ownership = own
        ? '<div class="post-ownership owned"><span class="ownership-dot own"></span>Your post · You can edit or delete it</div>'
        : '<div class="post-ownership"><span class="ownership-dot other"></span>Another author · Read-only for your account</div>'
      return `<article class="post-card"><div class="post-card-main"><a class="post-title" href="/app/post.html?id=${encodeURIComponent(post.id)}">${escapeHtml(post.title)}</a><p class="post-excerpt">${escapeHtml(post.content)}</p><div class="post-meta">${date}${post.updatedAt && post.updatedAt !== post.createdAt ? ` · Updated ${formatDate(post.updatedAt)}` : ""}</div>${ownership}</div><div class="post-card-actions"><a class="button secondary small" href="/app/post.html?id=${encodeURIComponent(post.id)}">Read post</a>${own ? `<a class="button secondary small" href="/app/post-form.html?id=${encodeURIComponent(post.id)}">Edit</a><button class="button danger small" type="button" data-delete="${escapeAttr(post.id)}" data-title="${escapeAttr(post.title)}">Delete</button>` : ""}</div></article>`
    })
    .join("")

  list
    .querySelectorAll("[data-delete]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        deletePost(button.dataset.delete, button.dataset.title),
      ),
    )
}

async function deletePost(id, title) {
  if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return
  const button = list.querySelector(`[data-delete="${CSS.escape(id)}"]`)
  if (button) {
    button.disabled = true
    button.textContent = "Deleting…"
  }
  const result = await api.delete(`/api/posts/${encodeURIComponent(id)}`)
  if (!result.ok) {
    showNotice(
      messageOf(
        result,
        "The post could not be deleted. You can only delete posts you own.",
      ),
    )
    if (button) {
      button.disabled = false
      button.textContent = "Delete"
    }
    return
  }
  showNotice(messageOf(result, "Post deleted."), "success")
  if (page > 1 && (page - 1) * PAGE_SIZE >= total - 1) page -= 1
  await loadPosts()
}

previous.addEventListener("click", async () => {
  if (page > 1) {
    page -= 1
    await loadPosts()
  }
})
next.addEventListener("click", async () => {
  if (page * PAGE_SIZE < total) {
    page += 1
    await loadPosts()
  }
})
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
function escapeAttr(value) {
  return escapeHtml(value)
}
function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
}
