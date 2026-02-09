// src/auth/msalConfig.ts
import { PublicClientApplication } from "@azure/msal-browser";

export const msalConfig = {
  auth: {
    clientId: "c96d832d-9afe-4715-ae65-764283074a3d",  // <-- replace
    authority: "https://login.microsoftonline.com/4ac50105-0c66-404e-a107-7cbd8a9a6442/v2.0",
    redirectUri: window.location.origin + "/login",
    postLogoutRedirectUri: window.location.origin + "/login",
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);
