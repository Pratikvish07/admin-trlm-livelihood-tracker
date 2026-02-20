import { createSlice } from '@reduxjs/toolkit';

const USERS = [
  { id: 'MASTER001', password: 'Admin@123', role: 'STATE_ADMIN', name: 'State Superior' },
  { id: 'DIST001', password: 'Dist@123', role: 'DISTRICT_ADMIN', name: 'District Admin' },
  { id: 'BLOCK001', password: 'Block@123', role: 'BLOCK_ADMIN', name: 'Block Admin' },
  { id: 'HA001', password: 'High@123', role: 'HIGH_AUTHORITY', name: 'High Authority' },
];

const initialState = {
  user: null,
  isAuthenticated: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginWithCredentials: (state, action) => {
      const { userId, password, role } = action.payload;
      const match = USERS.find(
        (u) => u.id === userId.trim().toUpperCase() && u.password === password && u.role === role
      );

      if (!match) {
        state.error = 'Invalid ID, Password, or Role';
        state.user = null;
        state.isAuthenticated = false;
        return;
      }

      state.user = { id: match.id, name: match.name, role: match.role };
      state.isAuthenticated = true;
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
});

export const { loginWithCredentials, setUser, logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
