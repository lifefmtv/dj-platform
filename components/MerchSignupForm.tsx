"use client";

import { useState } from "react";
import { submitEmailSignup } from "@/app/actions/signupActions";

export default function MerchSignupForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === "sending") return;
    setStatus("sending");
    const result = await submitEmailSignup(email, "merch");
    if (result.ok) {
      setStatus("success");
      setEmail("");
    } else {
      setStatus("error");
      setMessage(result.error ?? "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className="merch-signup-success">
        <span className="merch-signup-tick">✓</span>
        <p className="merch-signup-success-text">You&apos;re on the list. We&apos;ll hit you when it drops.</p>
      </div>
    );
  }

  return (
    <form className="merch-signup-form" onSubmit={handleSubmit} noValidate>
      <div className="merch-signup-row">
        <input
          type="email"
          className="merch-signup-input"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          required
          autoComplete="email"
        />
        <button
          type="submit"
          className="merch-signup-btn"
          disabled={status === "sending"}
        >
          {status === "sending" ? "..." : "Notify Me"}
        </button>
      </div>
      {status === "error" && (
        <p className="merch-signup-error">{message}</p>
      )}
    </form>
  );
}
