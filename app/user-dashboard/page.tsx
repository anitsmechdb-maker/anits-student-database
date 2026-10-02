"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function UserDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/user-login");
        return;
      }

      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || roleData?.role !== "viewer") {
        await supabase.auth.signOut();
        router.replace("/user-login");
        return;
      }

      setAuthorized(true);
    } catch (error) {
      console.error("USER DASHBOARD ERROR:", error);
      await supabase.auth.signOut();
      router.replace("/user-login");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/user-login");
  };

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f1f5f9",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            padding: "30px 40px",
            borderRadius: 12,
            boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
            color: "#344054",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          Loading User Dashboard...
        </div>
      </main>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fa",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          background: "#0f3d75",
          color: "#ffffff",
          padding: "18px 30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 23,
              fontWeight: 750,
            }}
          >
            ANITS Student Higher Education Database
          </h1>

          <p
            style={{
              margin: "6px 0 0",
              fontSize: 13,
              opacity: 0.9,
            }}
          >
            View &amp; Print Access
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              padding: "8px 13px",
              borderRadius: 20,
              background: "rgba(255,255,255,0.14)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            User: mech@anits
          </div>

          <button
            type="button"
            onClick={logout}
            style={{
              border: "1px solid rgba(255,255,255,0.45)",
              background: "#ffffff",
              color: "#0f3d75",
              borderRadius: 8,
              padding: "9px 16px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "35px 25px 50px",
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <h2
            style={{
              margin: 0,
              color: "#172b4d",
              fontSize: 26,
            }}
          >
            Welcome
          </h2>

          <p
            style={{
              margin: "8px 0 0",
              color: "#667085",
              fontSize: 14,
            }}
          >
            You have read-only access to the ANITS database.
            You can view, search, filter and print the available records.
          </p>
        </div>

        {/* ACCESS NOTICE */}
        <div
          style={{
            background: "#eff8ff",
            border: "1px solid #b2ddff",
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 25,
            color: "#175cd3",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          <strong>View-only account:</strong> Add, Edit, Delete and data
          import operations are not available for this login.
        </div>

        {/* MODULE CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 18,
          }}
        >
          {/* STUDENTS */}
          <ModuleCard
            icon="🎓"
            title="Student Database"
            description="View student records, search and filter student information."
            buttonText="View Students"
            onClick={() => router.push("/user-students")}
          />

          {/* ENTRANCE EXAMS */}
          <ModuleCard
            icon="📋"
            title="Entrance Exams / GATE"
            description="View GATE, CAT, IELTS and other entrance examination records."
            buttonText="View Entrance Records"
            onClick={() => router.push("/user-entrance-exams")}
          />

          {/* HIGHER EDUCATION */}
          <ModuleCard
            icon="🎓"
            title="Higher Education"
            description="View higher education details, university information and records."
            buttonText="View Higher Education"
            onClick={() => router.push("/user-higher-education")}
          />

          {/* ALUMNI */}
          <ModuleCard
            icon="🤝"
            title="Alumni Contributions"
            description="View alumni meetings, academic and financial contributions."
            buttonText="View Alumni"
            onClick={() => router.push("/alumni")}
          />

          {/* DATABASE STATISTICS */}
          <ModuleCard
            icon="📊"
            title="Database Statistics"
            description="View batch-wise statistics for Higher Education and GATE / Entrance examination records."
            buttonText="View Statistics"
            onClick={() => router.push("/user-statistics")}
          />
        </div>

        {/* PRINT INFORMATION */}
        <div
          style={{
            marginTop: 30,
            background: "#ffffff",
            border: "1px solid #e4e7ec",
            borderRadius: 12,
            padding: 22,
          }}
        >
          <h3
            style={{
              margin: "0 0 8px",
              color: "#172b4d",
              fontSize: 17,
            }}
          >
            Printing &amp; PDF
          </h3>

          <p
            style={{
              margin: 0,
              color: "#667085",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            Open any module above to search or filter the required records.
            The available Print Preview and Save as PDF options can be used
            to generate reports.
          </p>
        </div>
      </section>
    </main>
  );
}

function ModuleCard({
  icon,
  title,
  description,
  buttonText,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e4e7ec",
        borderRadius: 14,
        padding: 22,
        minHeight: 210,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        boxShadow: "0 3px 12px rgba(16,24,40,0.04)",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          background: "#eef4ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          marginBottom: 15,
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          margin: 0,
          color: "#172b4d",
          fontSize: 18,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: "9px 0 18px",
          color: "#667085",
          fontSize: 13,
          lineHeight: 1.55,
          flex: 1,
        }}
      >
        {description}
      </p>

      <button
        type="button"
        onClick={onClick}
        style={{
          width: "100%",
          border: "none",
          borderRadius: 8,
          padding: "11px 14px",
          background: "#0f3d75",
          color: "#ffffff",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {buttonText} →
      </button>
    </div>
  );
}