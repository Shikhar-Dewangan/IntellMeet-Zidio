import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentMeeting: null,
  participants: [],
  isLoading: false,
};

const meetingSlice = createSlice({
  name: "meeting",
  initialState,

  reducers: {
    setMeeting: (state, action) => {
      state.currentMeeting = action.payload;
    },

    clearMeeting: (state) => {
      state.currentMeeting = null;
      state.participants = [];
    },

    setParticipants: (state, action) => {
      state.participants = action.payload;
    },

    addParticipant: (state, action) => {
      state.participants.push(action.payload);
    },

    removeParticipant: (state, action) => {
      state.participants = state.participants.filter(
        (participant) => participant._id !== action.payload,
      );
    },

    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setMeeting,
  clearMeeting,
  setParticipants,
  addParticipant,
  removeParticipant,
  setLoading,
} = meetingSlice.actions;

export default meetingSlice.reducer;
