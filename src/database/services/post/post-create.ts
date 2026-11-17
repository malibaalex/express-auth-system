import BaseService from "@/database/system/base-service.js"
import type { Post } from "@/generated/prisma/client.js"

export interface CreatePostInput {
  authorId: string
  title: string
  content: string
}

class CreatePostService extends BaseService<CreatePostInput, Post> {
  protected async transaction(data: CreatePostInput): Promise<Post | null> {
    return await this.database.post.create({ data })
  }
}

export default CreatePostService
