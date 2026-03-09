import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, setAuthToken, clearAuthToken, getAuthToken } from '../../services/api';

const AUTH_WORKFLOW_KEY = 'trlm_auth_workflow_v1';
const AUTH_SESSION_KEY = 'trlm_auth_session_v1';

const loadWorkflowState = () => {
  if (typeof window === 'undefined') {
    return { pendingRegistrations: [], registeredUsers: [] };
  }
  try {
    const raw = window.localStorage.getItem(AUTH_WORKFLOW_KEY);
    if (!raw) return { pendingRegistrations: [], registeredUsers: [] };
    const parsed = JSON.parse(raw);
    return {
      pendingRegistrations: Array.isArray(parsed.pendingRegistrations) ? parsed.pendingRegistrations : [],
      registeredUsers: Array.isArray(parsed.registeredUsers) ? parsed.registeredUsers : [],
    };
  } catch {
    return { pendingRegistrations: [], registeredUsers: [] };
  }
};

const persistWorkflowState = (state) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      AUTH_WORKFLOW_KEY,
      JSON.stringify({
        pendingRegistrations: state.pendingRegistrations,
        registeredUsers: state.registeredUsers,
      }),
    );
  } catch {
    // Ignore storage errors.
  }
};

const loadAuthSession = () => {
  if (typeof window === 'undefined') {
    return { token: null, user: null };
  }
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return { token: getAuthToken(), user: null };
    const parsed = JSON.parse(raw);
    return {
      token: parsed?.token || getAuthToken(),
      user: parsed?.user || null,
    };
  } catch {
    return { token: getAuthToken(), user: null };
  }
};

const persistAuthSession = (token, user) => {
  if (typeof window === 'undefined') return;
  try {
    if (!token || !user) {
      window.localStorage.removeItem(AUTH_SESSION_KEY);
      return;
    }
    window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ token, user }));
  } catch {
    // Ignore storage errors.
  }
};

const normalizeRoleFromApi = (rawRole) => {
  const role = String(rawRole || '').trim().toLowerCase();
  if (role === 'adminuser01' || role === 'adminuser02') return 'STATE_ADMIN';
  if (role.includes('state')) return 'STATE_ADMIN';
  if (role.includes('district')) return 'DISTRICT_ADMIN';
  if (role.includes('block')) return 'BLOCK_STAFF';
  return role.toUpperCase() || 'UNKNOWN';
};

const buildPermissions = (role, rawApiRole) => {
  const apiRole = String(rawApiRole || '').trim().toLowerCase();
  if (role === 'STATE_ADMIN') {
    if (apiRole === 'adminuser01') {
      return ['approve_users', 'view_dashboard', 'view_reports'];
    }
    if (apiRole === 'adminuser02') {
      return ['full_access', 'view_dashboard', 'manage_district', 'manage_block', 'view_reports'];
    }
    return ['full_access', 'approve_users', 'view_dashboard', 'manage_district', 'manage_block', 'view_reports'];
  }
  if (role === 'DISTRICT_ADMIN') {
    return ['view_dashboard', 'manage_block', 'view_reports'];
  }
  if (role === 'BLOCK_STAFF') {
    return ['view_dashboard'];
  }
  return ['view_dashboard'];
};

export const loginWithApi = createAsyncThunk(
  'auth/loginWithApi',
  async ({ livelihoodTrackerId, password }, { rejectWithValue }) => {
    try {
      const response = await api.login({ livelihoodTrackerId, password });
      if (!response?.token) {
        return rejectWithValue('Login failed: token missing in response');
      }

      const normalizedRole = normalizeRoleFromApi(response.role);
      const districtValue = String(response.district || '').toLowerCase() === 'null' ? null : (response.district || null);
      const blockValue = String(response.block || '').toLowerCase() === 'null' ? null : (response.block || null);
      const user = {
        id: livelihoodTrackerId,
        name: livelihoodTrackerId,
        role: normalizedRole,
        apiRole: response.role,
        district: districtValue,
        block: blockValue,
        permissions: buildPermissions(normalizedRole, response.role),
      };

      return {
        token: response.token,
        user,
      };
    } catch (err) {
      return rejectWithValue(err?.message || 'Login failed');
    }
  },
);

const persistedWorkflow = loadWorkflowState();
const persistedSession = loadAuthSession();

const initialState = {
  user: persistedSession.user,
  token: persistedSession.token,
  isAuthenticated: Boolean(persistedSession.token),
  isLoading: false,
  error: null,
  pendingRegistrations: persistedWorkflow.pendingRegistrations,
  registeredUsers: persistedWorkflow.registeredUsers,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signUp: (state, action) => {
      const {
        districtName,
        blockName,
        officialName,
        contactNumber,
        officialEmail,
        designation,
        livelihoodTrackerId,
        password,
        role,
      } = action.payload;

      const normalizedOfficialEmail = officialEmail.trim().toLowerCase();
      const exists = state.registeredUsers.find((u) => u.officialEmail?.toLowerCase() === normalizedOfficialEmail);
      if (exists) {
        state.error = 'Email already registered';
        return;
      }

      const newUser = {
        id: `REG_${Date.now()}`,
        districtName,
        blockName,
        officialName,
        contactNumber,
        officialEmail: normalizedOfficialEmail,
        designation,
        livelihoodTrackerId,
        password,
        role,
        status: 'Pending',
        registrationDate: new Date().toISOString(),
      };

      state.pendingRegistrations.push(newUser);
      state.registeredUsers.push(newUser);
      state.error = null;
      persistWorkflowState(state);
    },

    approveUser: (state, action) => {
      const { userId } = action.payload;
      if (String(state.user?.apiRole || '').toLowerCase() !== 'adminuser01') return;

      const approvalDate = new Date().toISOString();
      const pendingUser = state.pendingRegistrations.find((u) => u.id === userId);
      const registeredUser = state.registeredUsers.find((u) => u.id === userId);
      if (pendingUser) {
        pendingUser.status = 'Approved';
        pendingUser.approvalDate = approvalDate;
      }
      if (registeredUser) {
        registeredUser.status = 'Approved';
        registeredUser.approvalDate = approvalDate;
      }
      persistWorkflowState(state);
    },

    rejectUser: (state, action) => {
      const { userId } = action.payload;
      if (String(state.user?.apiRole || '').toLowerCase() !== 'adminuser01') return;

      const rejectionDate = new Date().toISOString();
      const pendingUser = state.pendingRegistrations.find((u) => u.id === userId);
      const registeredUser = state.registeredUsers.find((u) => u.id === userId);
      if (pendingUser) {
        pendingUser.status = 'Rejected';
        pendingUser.rejectionDate = rejectionDate;
      }
      if (registeredUser) {
        registeredUser.status = 'Rejected';
        registeredUser.rejectionDate = rejectionDate;
      }
      persistWorkflowState(state);
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      clearAuthToken();
      persistAuthSession(null, null);
    },

    clearAuthError: (state) => {
      state.error = null;
    },

    setPendingRegistrations: (state, action) => {
      state.pendingRegistrations = action.payload;
      persistWorkflowState(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginWithApi.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithApi.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        setAuthToken(action.payload.token);
        persistAuthSession(action.payload.token, action.payload.user);
      })
      .addCase(loginWithApi.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload || action.error.message || 'Login failed';
      });
  },
});

export const { signUp, approveUser, rejectUser, logout, clearAuthError, setPendingRegistrations } = authSlice.actions;
export default authSlice.reducer;
