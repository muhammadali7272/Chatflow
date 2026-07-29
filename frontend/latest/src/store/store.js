import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import { persistConfig } from './persistConfig';
import authReducer from '../features/auth/authSlice';
import chatReducer from '../features/chat/chatSlice';
import usersReducer from '../features/users/usersSlice';
import presenceReducer from '../features/presence/presenceSlice';

// friendsSlice was removed from the store: the sanjarb backend
// (prod/src/index.js) has no ephemeral friend_request:* events — contact
// adds are direct, mutual and persisted, so there is no pending-request
// state to track.
const rootReducer = combineReducers({
  auth: authReducer,
  chat: chatReducer,
  users: usersReducer,
  presence: presenceReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
