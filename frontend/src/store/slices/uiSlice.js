import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isSidebarOpen: true,
  isMobileSidebarOpen: false,
  isLoading: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,

  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },

    setSidebarOpen: (state, action) => {
      state.isSidebarOpen = action.payload;
    },

    setMobileSidebarOpen: (state, action) => {
      state.isMobileSidebarOpen = action.payload;
    },

    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setMobileSidebarOpen,
  setLoading,
} = uiSlice.actions;

export default uiSlice.reducer;
