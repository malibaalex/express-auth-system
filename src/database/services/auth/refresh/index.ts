import FindRefreshTokenByHashService from "./refresh-token-find-by-hash.js"
import RevokeAllRefreshTokensService from "./refresh-token-revoke-all.js"
import RevokeUserRefreshTokenByHashService from "./refresh-token-revoke-by-hash.js"
import RevokeRefreshTokenService from "./refresh-token-revoke-by-user-id.js"
import SaveRefreshTokenService from "./refresh-token-save.js"
import SwapRefreshTokenService from "./refresh-token-rotate.js"

const RefreshToken = {
  Save: new SaveRefreshTokenService(),
  Rotate: new SwapRefreshTokenService(),
  FindByHash: new FindRefreshTokenByHashService(),
  RevokeByUserId: new RevokeRefreshTokenService(),
  RevokeByHash: new RevokeUserRefreshTokenByHashService(),
  RevokeAll: new RevokeAllRefreshTokensService(),
}

export default RefreshToken
