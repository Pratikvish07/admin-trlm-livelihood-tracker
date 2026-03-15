import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { clearStoredAuth, getStoredAuth, loginAdmin, saveAuth } from '../../services/auth';

const storedAuth = getStoredAuth();

const initialState = {
  user: storedAuth?.user || null,
  token: storedAuth?.token || '',
  isAuthenticated: !!storedAuth?.token,
  error: null,
  loading: false,
};

export const loginWithCredentials = createAsyncThunk(
  'auth/loginWithCredentials',
  async ({ userId, password }, { rejectWithValue }) => {
    if (!userId?.trim() || !password?.trim()) {
      return rejectWithValue('User ID and Password are required');
    }

    try {
      const auth = await loginAdmin({ userId, password });
      saveAuth(auth);
      return auth;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.title ||
        'Login failed. Please check your credentials and try again.';

      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload?.user || action.payload || null;
      state.token = action.payload?.token || state.token;
      state.isAuthenticated = !!state.token || !!state.user;
      state.error = null;
    },
    logout: (state) => {
      clearStoredAuth();
      state.user = null;
      state.token = '';
      state.isAuthenticated = false;
      state.error = null;
      state.loading = false;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginWithCredentials.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithCredentials.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginWithCredentials.rejected, (state, action) => {
        clearStoredAuth();
        state.loading = false;
        state.user = null;
        state.token = '';
        state.isAuthenticated = false;
        state.error = action.payload || 'Login failed';
      });
  },
});

export const { setUser, logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
