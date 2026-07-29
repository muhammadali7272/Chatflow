import { createSlice } from '@reduxjs/toolkit';

// Backend (prod/src/start.js) issues no token/session — `user` here is the
// entire "logged in" state. There is no server-side validation of it after
// login/register (see routes/ProtectedRoute.jsx).
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      const userData = action.payload;
      state.user = {
        _id: userData._id,
        email: userData.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        age: userData.age ?? null,
        bio: userData.bio || '',
        contacts: userData.contacts || [],
        verified: userData.verified ?? true,
      };
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    // Merge partial/full payload into the current user object. Used by
    // Drawer for profile edits, theme toggle, privacy & language changes.
    updateUser: (state, action) => {
      if (!state.user) {
        state.user = action.payload;
      } else {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { setUser, setLoading, setError, clearError, logout, updateUser } = authSlice.actions;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
