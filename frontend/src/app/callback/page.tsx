"use client";

import { useEffect } from "react";

export default function CallbackPage() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      sessionStorage.setItem("ssb-auth-code", code);
    }
    window.location.replace("/");
  }, []);

  return <p className="text-muted-foreground">Redirecting...</p>;
}
