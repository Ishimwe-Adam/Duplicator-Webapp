import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }): void;
          renderButton(
            element: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              width?: number;
              locale?: string;
            }
          ): void;
        };
      };
    };
  }
}

interface Props {
  onCredential: (credential: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
  theme?: "outline" | "filled_black" | "filled_blue";
}

let gisLoaded = false;
const pendingCallbacks: Array<() => void> = [];

function loadGis(callback: () => void) {
  if (gisLoaded && window.google) {
    callback();
    return;
  }
  pendingCallbacks.push(callback);
  if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
    return;
  }
  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.defer = true;
  script.onload = () => {
    gisLoaded = true;
    for (const cb of pendingCallbacks.splice(0)) cb();
  };
  document.head.appendChild(script);
}

export default function GoogleSignInButton({ onCredential, text = "signin_with", theme = "outline" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    if (!clientId) return;
    loadGis(() => {
      if (!window.google || !containerRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => onCredential(response.credential),
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme,
        size: "large",
        text,
        shape: "rectangular",
        width: 380,
      });
    });
  }, [clientId, onCredential, text, theme]);

  if (!clientId) return null;

  return <div ref={containerRef} style={{ marginBottom: 4 }} />;
}
