import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },

    clearCredentials: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    updateUser: (state, action) => {
      state.user = {
        ...state.user,
        ...action.payload,
      };
    },
  },
});

export const { setCredentials, clearCredentials, setLoading, updateUser } =
  authSlice.actions;

export default authSlice.reducer;
