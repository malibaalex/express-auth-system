import FindProviderByAccountService from "./provider-find-by-account.js"
import CreateProviderService from "./provider-create.js"
import UpdateProviderService from "./provider-update.js"

const Provider = {
  FindByAccount: new FindProviderByAccountService(),
  Create: new CreateProviderService(),
  Update: new UpdateProviderService(),
}

export default Provider
