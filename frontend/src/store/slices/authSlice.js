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
      const payload = action.payload;
      const responseData = payload?.data?.data ?? payload?.data ?? payload;
      const user = responseData?.user ?? responseData;

      if (!user) return;

      state.user = user;
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
