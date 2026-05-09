export const dynamic = "force-dynamic";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh",
      }}
    >
      {/*
        fallbackRedirectUrl: where to go after sign-in when no redirect_url
        query param is present (e.g. if someone navigates directly here).
        The middleware also sets redirect_url on the URL, which Clerk
        picks up automatically and takes priority over fallbackRedirectUrl.
      */}
      <SignIn fallbackRedirectUrl="/admin" />
    </main>
  );
}