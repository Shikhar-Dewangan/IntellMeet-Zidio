import { useEffect, useRef } from "react";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GIS_SCRIPT_SELECTOR =
  'script[src^="https://accounts.google.com/gsi/client"]';
let initializedClientId = null;
let activeCallbacks = null;

function waitForGoogleIdentityServices() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);

  const script = document.querySelector(GIS_SCRIPT_SELECTOR);
  if (!script)
    return Promise.reject(
      new Error("Google sign-in is unavailable. Please try again."),
    );

  return new Promise((resolve, reject) => {
    const handleLoad = () => {
      if (window.google?.accounts?.id) resolve(window.google);
      else
        reject(new Error("Google sign-in is unavailable. Please try again."));
    };
    const handleError = () =>
      reject(new Error("Google sign-in is unavailable. Please try again."));

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
  });
}

function GoogleSignInButton({
  onSuccess,
  onError,
  disabled = false,
  className = "",
}) {
  const buttonRef = useRef(null);
  const callbacksRef = useRef({ onSuccess, onError });

  useEffect(() => {
    callbacksRef.current = { onSuccess, onError };
    activeCallbacks = callbacksRef.current;
    return () => {
      if (activeCallbacks === callbacksRef.current) activeCallbacks = null;
    };
  }, [onSuccess, onError]);

  useEffect(() => {
    let cancelled = false;
    let resizeObserver;
    const reportError = (message) => callbacksRef.current.onError?.(message);

    if (!clientId) {
      reportError("Google sign-in is not configured for this app yet.");
      return;
    }

    waitForGoogleIdentityServices()
      .then((google) => {
        if (cancelled || !buttonRef.current) return;

        if (initializedClientId !== clientId) {
          google.accounts.id.initialize({
            client_id: clientId,
            ux_mode: "popup",
            auto_select: false,
            callback: ({ credential }) => {
              if (credential) activeCallbacks?.onSuccess?.(credential);
              else
                activeCallbacks?.onError?.(
                  "Google sign-in could not be completed.",
                );
            },
          });
          initializedClientId = clientId;
        }

        // GIS owns this button and the account chooser it opens. Do not style or
        // recreate either surface in the app.
        let renderedWidth = 0;
        const renderButton = () => {
          if (!buttonRef.current) return;
          const width = Math.min(
            Math.max(buttonRef.current.clientWidth, 120),
            400,
          );
          if (width === renderedWidth) return;

          renderedWidth = width;
          buttonRef.current.replaceChildren();
          google.accounts.id.renderButton(buttonRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "pill",
            logo_alignment: "left",
            width,
            locale: "en",
          });
        };

        renderButton();
        resizeObserver = new ResizeObserver(renderButton);
        resizeObserver.observe(buttonRef.current);
      })
      .catch((error) => {
        if (!cancelled) reportError(error.message);
      });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
    };
  }, []);

  return (
    <div
      ref={buttonRef}
      className={`${className || "w-full"}${disabled ? " pointer-events-none opacity-60" : ""}`}
      aria-label="Google sign-in"
      aria-disabled={disabled}
    />
  );
}

export default GoogleSignInButton;
