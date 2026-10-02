"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function UserLoginPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("mech@anits");
  const [password, setPassword] = useState("anits123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setErrorMessage("");
    setLoading(true);

    try {
      // Fixed User ID
      if (userId.trim().toLowerCase() !== "mech@anits") {
        setErrorMessage("Invalid User ID or Password.");
        setLoading(false);
        return;
      }

      // Internal Supabase account
      const internalEmail = "mech@anits.edu.in";

      const { data, error } = await supabase.auth.signInWithPassword({
        email: internalEmail,
        password,
      });

      if (error || !data.user) {
        setErrorMessage("Invalid User ID or Password.");
        setLoading(false);
        return;
      }

      // Check viewer role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (roleError) {
        await supabase.auth.signOut();
        setErrorMessage("Unable to verify user permissions.");
        setLoading(false);
        return;
      }

      if (roleData?.role !== "viewer") {
        await supabase.auth.signOut();
        setErrorMessage("This account is not authorized for User Login.");
        setLoading(false);
        return;
      }

      router.push("/user-dashboard");
    } catch (error) {
      console.error("USER LOGIN ERROR:", error);
      setErrorMessage("Unable to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          background: "#ffffff",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 12px 35px rgba(0,0,0,0.12)",
          border: "1px solid #e2e8f0",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            background: "#0f3d75",
            padding: "30px 25px",
            textAlign: "center",
            color: "#ffffff",
          }}
        >
          <div
            style={{
              width: 65,
              height: 65,
              borderRadius: "50%",
              background: "#ffffff",
              color: "#0f3d75",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              fontWeight: 800,
              fontSize: 17,
            }}
          >
            ANITS
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 23,
              fontWeight: 750,
            }}
          >
            ANITS
          </h1>

          <p
            style={{
              margin: "7px 0 0",
              fontSize: 13,
            }}
          >
            Student Higher Education Database
          </p>
        </div>

        {/* LOGIN AREA */}
        <div style={{ padding: 30 }}>
          <h2
            style={{
              margin: "0 0 6px",
              textAlign: "center",
              color: "#172b4d",
              fontSize: 22,
            }}
          >
            User Login
          </h2>

          <p
            style={{
              textAlign: "center",
              margin: "0 0 25px",
              color: "#667085",
              fontSize: 13,
            }}
          >
            View and Print Access
          </p>

          <form onSubmit={handleLogin}>
            {/* USER ID */}
            <div style={{ marginBottom: 18 }}>
              <label
                htmlFor="userId"
                style={{
                  display: "block",
                  marginBottom: 8,
                  color: "#344054",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                User ID
              </label>

              <input
                id="userId"
                name="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                autoComplete="username"
                style={{
                  display: "block",
                  width: "100%",
                  height: 48,
                  boxSizing: "border-box",
                  padding: "0 14px",
                  border: "2px solid #94a3b8",
                  borderRadius: 8,
                  background: "#ffffff",
                  color: "#111827",
                  fontSize: 15,
                  fontWeight: 600,
                  outline: "none",
                }}
              />
            </div>

            {/* PASSWORD */}
            <div style={{ marginBottom: 20 }}>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  marginBottom: 8,
                  color: "#344054",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Password
              </label>

              <div
                style={{
                  position: "relative",
                }}
              >
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{
                    display: "block",
                    width: "100%",
                    height: 48,
                    boxSizing: "border-box",
                    padding: "0 75px 0 14px",
                    border: "2px solid #94a3b8",
                    borderRadius: 8,
                    background: "#ffffff",
                    color: "#111827",
                    fontSize: 15,
                    outline: "none",
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: 7,
                    height: 34,
                    padding: "0 10px",
                    border: "none",
                    borderRadius: 6,
                    background: "#e2e8f0",
                    color: "#0f3d75",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* ERROR */}
            {errorMessage && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "11px 13px",
                  borderRadius: 8,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  fontSize: 13,
                }}
              >
                {errorMessage}
              </div>
            )}

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              style={{
                display: "block",
                width: "100%",
                height: 50,
                border: "none",
                borderRadius: 9,
                background: loading ? "#64748b" : "#0f3d75",
                color: "#ffffff",
                fontSize: 16,
                fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 10px rgba(15,61,117,0.25)",
              }}
            >
              {loading ? "Logging in..." : "LOGIN"}
            </button>
          </form>

          {/* BACK BUTTON */}
          <button
            type="button"
            onClick={() => router.push("/")}
            style={{
              display: "block",
              width: "100%",
              height: 44,
              marginTop: 14,
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              background: "#ffffff",
              color: "#334155",
              fontSize: 13,
              fontWeight: 650,
              cursor: "pointer",
            }}
          >
            ← Back to Home
          </button>

          <p
            style={{
              textAlign: "center",
              margin: "20px 0 0",
              fontSize: 11,
              color: "#94a3b8",
            }}
          >
            Authorized view-only access
          </p>
        </div>
      </div>
    </main>
  );
}