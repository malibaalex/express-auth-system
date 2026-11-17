import ProfileUpdateRoute from "./profile-update.js"

const path = "/user/profile"

const Profile = {
  Update: new ProfileUpdateRoute(path),
}

export default Profile
