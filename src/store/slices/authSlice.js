import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, clearAuthToken, getAuthToken, setAuthToken } from '../../services/api';
import { clearStoredAuth, getStoredAuth, loginAdmin, saveAuth } from '../../services/auth';

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
      })
    );
  } catch {
    // Ignore storage errors.
  }
};

const loadAuthSession = () => {
  const storedAuth = getStoredAuth();
  if (storedAuth?.token) {
    return {
      token: storedAuth.token,
      user: storedAuth.user || null,
    };
  }

  if (typeof window === 'undefined') {
    return { token: getAuthToken(), user: null };
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
  if (role === 'BLOCK_ADMIN' || role === 'BLOCK_STAFF') {
    return ['view_dashboard', 'manage_block'];
  }
  return ['view_dashboard'];
};

const deriveRoleId = (rawRole, fallbackRole) => {
  const normalized = String(rawRole || fallbackRole || '').trim().toUpperCase();
  if (normalized === 'ADMINUSER01' || normalized === 'ADMINUSER02') return 1;
  if (normalized === 'STATE_ADMIN') return 1;
  if (normalized === 'DISTRICT_ADMIN') return 2;
  if (normalized === 'DISTRICT_STAFF') return 2;
  if (normalized === 'BLOCK_ADMIN') return 3;
  if (normalized === 'BLOCK_STAFF') return 3;
  return 0;
};

const normalizeUser = (userId, response) => {
  const normalizedRole = normalizeRoleFromApi(response?.role);
  const districtValue = String(response?.district || '').toLowerCase() === 'null' ? null : response?.district || null;
  const blockValue = String(response?.block || '').toLowerCase() === 'null' ? null : response?.block || null;
  const responseRoleId = Number(response?.roleId) || deriveRoleId(response?.role, normalizedRole);

  return {
    id: String(userId || response?.userId || '').toUpperCase(),
    name: String(userId || response?.officialName || response?.userId || '').toUpperCase(),
    roleId: responseRoleId,
    role: normalizedRole,
    apiRole: response?.role || normalizedRole,
    district: districtValue,
    block: blockValue,
    permissions: buildPermissions(normalizedRole, response?.role),
  };
};

const normalizePersistedUser = (user) => {
  if (!user) return null;

  const normalizedRole = normalizeRoleFromApi(user?.apiRole || user?.role);
  const apiRole = user?.apiRole || user?.role || normalizedRole;

  return {
    ...user,
    roleId: Number(user?.roleId) || deriveRoleId(apiRole, normalizedRole),
    role: normalizedRole,
    apiRole,
    permissions: buildPermissions(normalizedRole, apiRole),
  };
};

export const loginWithApi = createAsyncThunk(
  'auth/loginWithApi',
  async ({ livelihoodTrackerId, password }, { rejectWithValue }) => {
    try {
      const response = await api.login({ livelihoodTrackerId, password });
      if (!response?.token) {
        return rejectWithValue('Login failed: token missing in response');
      }

      return {
        token: response.token,
        user: normalizeUser(livelihoodTrackerId, response),
      };
    } catch (error) {
      return rejectWithValue(error?.message || 'Login failed');
    }
  }
);

export const loginWithCredentials = createAsyncThunk(
  'auth/loginWithCredentials',
  async ({ userId, password }, { rejectWithValue }) => {
    if (!userId?.trim() || !password?.trim()) {
      return rejectWithValue('User ID and Password are required');
    }

    try {
      const auth = await loginAdmin({ userId, password });
      const normalized = {
        token: auth.token,
        user: {
          ...auth.user,
          roleId: Number(auth.user?.roleId) || deriveRoleId(auth.user?.role),
          role: normalizeRoleFromApi(auth.user?.role),
          apiRole: auth.user?.role,
          permissions: buildPermissions(normalizeRoleFromApi(auth.user?.role), auth.user?.role),
        },
      };
      saveAuth(normalized);
      return normalized;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.title ||
        error?.message ||
        'Login failed. Please check your credentials and try again.';

      return rejectWithValue(message);
    }
  }
);

const persistedWorkflow = loadWorkflowState();
const persistedSession = loadAuthSession();

const initialState = {
  user: normalizePersistedUser(persistedSession.user),
  token: persistedSession.token || '',
  isAuthenticated: Boolean(persistedSession.token),
  error: null,
  loading: false,
  isLoading: false,
  pendingRegistrations: persistedWorkflow.pendingRegistrations,
  registeredUsers: persistedWorkflow.registeredUsers,
};

const applyLoginSuccess = (state, payload) => {
  state.loading = false;
  state.isLoading = false;
  state.error = null;
  state.user = payload.user;
  state.token = payload.token;
  state.isAuthenticated = true;
  setAuthToken(payload.token, payload.user);
  persistAuthSession(payload.token, payload.user);
};

const applyLoginFailure = (state, errorMessage) => {
  clearStoredAuth();
  state.loading = false;
  state.isLoading = false;
  state.user = null;
  state.token = '';
  state.isAuthenticated = false;
  state.error = errorMessage || 'Login failed';
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
      const exists = state.registeredUsers.find((user) => user.officialEmail?.toLowerCase() === normalizedOfficialEmail);
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
      const pendingUser = state.pendingRegistrations.find((user) => user.id === userId);
      const registeredUser = state.registeredUsers.find((user) => user.id === userId);

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
      const pendingUser = state.pendingRegistrations.find((user) => user.id === userId);
      const registeredUser = state.registeredUsers.find((user) => user.id === userId);

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
    setUser: (state, action) => {
      state.user = normalizePersistedUser(action.payload?.user || action.payload || null);
      state.token = action.payload?.token || state.token;
      state.isAuthenticated = !!state.token || !!state.user;
      state.error = null;
    },
    logout: (state) => {
      clearStoredAuth();
      clearAuthToken();
      persistAuthSession(null, null);
      state.user = null;
      state.token = '';
      state.isAuthenticated = false;
      state.error = null;
      state.loading = false;
      state.isLoading = false;
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
        state.loading = true;
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithApi.fulfilled, (state, action) => {
        applyLoginSuccess(state, action.payload);
      })
      .addCase(loginWithApi.rejected, (state, action) => {
        applyLoginFailure(state, action.payload || action.error.message);
      })
      .addCase(loginWithCredentials.pending, (state) => {
        state.loading = true;
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithCredentials.fulfilled, (state, action) => {
        applyLoginSuccess(state, action.payload);
      })
      .addCase(loginWithCredentials.rejected, (state, action) => {
        applyLoginFailure(state, action.payload || 'Login failed');
      });
  },
});

export const {
  signUp,
  approveUser,
  rejectUser,
  setUser,
  logout,
  clearAuthError,
  setPendingRegistrations,
} = authSlice.actions;

export default authSlice.reducer;
