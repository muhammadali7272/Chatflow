// The sanjarb backend (prod/src/index.js) exposes NO profile-update endpoint —
// the User model only has firstName / lastName / age / bio / email / contacts,
// and there is no REST route (or socket event) to change them. So profile
// edits, theme, language and privacy toggles are applied LOCALLY: the Drawer
// merges the returned patch into the Redux `auth.user`, which redux-persist
// saves to localStorage. This function just echoes the patch back — nothing is
// sent to the server. Kept as an async service so callers need no change if a
// real endpoint is added later.
export const updateProfile = async (data) => {
  return { user: data };
};

export default {
  updateProfile,
};
