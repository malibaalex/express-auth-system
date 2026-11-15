import RevokeAllRefreshTokensService from "./refresh-token-revoke-all.js"
import RevokeRefreshTokenService from "./refresh-token-revoke.js"
import SaveRefreshTokenService from "./refresh-token-save.js"
import SwapRefreshTokenService from "./refresh-token-swap.js"

const RefreshToken = {
  Save: new SaveRefreshTokenService(),
  Rotate: new SwapRefreshTokenService,
  Revoke: new RevokeRefreshTokenService(),
  RevokeAll: new RevokeAllRefreshTokensService()
}

export default RefreshToken