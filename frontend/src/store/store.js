import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import meetingReducer from "./slices/meetingSlice";
import uiReducer from "./slices/uiSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    meeting: meetingReducer,
    ui: uiReducer,
  },
});

export default store;
