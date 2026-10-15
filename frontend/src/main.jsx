import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";

import "./index.css";
import App from "./App.jsx";
import store from "./store/store.js";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { AppearanceProvider } from "./context/AppearanceContext.jsx";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
      <ThemeProvider>
    <AppearanceProvider>
        <BrowserRouter>
          <App />
          <Toaster position="top-right" reverseOrder={false} />
        </BrowserRouter>
    </AppearanceProvider>
      </ThemeProvider>
  </Provider>,
);
