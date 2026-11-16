import { IRoute } from "@/types/app.js"
import Auth from "./auth/index.js"

const routes: IRoute[] = [...Object.values(Auth)]

export default routes
