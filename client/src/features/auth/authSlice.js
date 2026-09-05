import { createSlice } from '@reduxjs/toolkit';

const storedUser = localStorage.getItem('labflow_user');
const storedToken = localStorage.getItem('labflow_token');

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('labflow_user', JSON.stringify(action.payload.user));
      localStorage.setItem('labflow_token', action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('labflow_user');
      localStorage.removeItem('labflow_token');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
