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
      <SignIn
        routing="hash"
        signUpUrl="/admin/sign-in"
        fallbackRedirectUrl="/admin"
      />
    </main>
  );
}