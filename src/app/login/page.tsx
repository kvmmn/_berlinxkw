"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") ?? "/portal";
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    if (!res.ok) {
      setError("Invalid passcode");
      return;
    }
    router.push(from);
    router.refresh();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <Image src="/logo.png" alt="berlin × kawe" width={72} height={72} style={{ marginBottom: "1.5rem" }} />
      <h1 className="bk-display" style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>
        berlin × kawe
      </h1>
      <p className="bk-meta" style={{ color: "var(--bk-gray-70)", marginBottom: "0.5rem" }}>
        advisor portal
      </p>
      <p className="bk-meta bk-persian" style={{ color: "var(--bk-gray-45)", marginBottom: "2rem", fontSize: "0.75rem" }}>
        رمز ورود را وارد کنید
      </p>
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 360 }}>
        <input
          type="password"
          className="bk-input"
          placeholder="passcode"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          autoComplete="current-password"
        />
        {error ? (
          <p style={{ color: "#ff6b6b", fontSize: "0.875rem", marginTop: "0.5rem" }}>{error}</p>
        ) : null}
        <button type="submit" className="bk-btn bk-btn-primary" style={{ width: "100%", marginTop: "1rem" }}>
          enter
        </button>
      </form>
      {process.env.NODE_ENV === "development" ? (
        <p className="bk-meta" style={{ color: "var(--bk-gray-45)", marginTop: "1.5rem", fontSize: "0.65rem" }}>
          Local dev: set advisor passcode in your environment file if needed.
        </p>
      ) : null}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
