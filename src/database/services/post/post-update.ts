import BaseService from "@/database/system/base-service.js"
import type { Post } from "@/generated/prisma/client.js"

export interface UpdatePostInput {
  id: string
  data: { title?: string; content?: string } // undefined = leave unchanged
}

class UpdatePostService extends BaseService<UpdatePostInput, Post> {
  protected async transaction(input: UpdatePostInput): Promise<Post | null> {
    return await this.database.post.update({
      where: { id: input.id },
      data: input.data,
    })
  }
}

export default UpdatePostService
