"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin-login");
  }

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              ANITS
            </h1>
            <p className="text-sm text-slate-500">
              Student Higher Education Database
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Dashboard */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800">
            Admin Dashboard
          </h2>

          <p className="mt-2 text-slate-500">
            Manage students, entrance examinations, higher education and
            alumni information.
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* Students */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <span className="text-xl font-bold text-blue-600">
                S
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-800">
              Students
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Manage student basic information and academic records.
            </p>

            <button
              onClick={() => router.push("/students")}
              className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Manage Students
            </button>
          </div>

          {/* Entrance Examinations */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
              <span className="text-xl font-bold text-orange-600">
                E
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-800">
              Entrance Examinations
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Manage GATE, CAT, IELTS and other entrance examination
              scores and ranks.
            </p>

            <button
              onClick={() => router.push("/entrance-exams")}
              className="mt-5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Manage Exams & Ranks
            </button>
          </div>

          {/* Higher Education */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
              <span className="text-xl font-bold text-green-600">
                H
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-800">
              Higher Education
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Manage students who pursued higher education, programs,
              universities and admission details.
            </p>

            <button
              onClick={() => router.push("/higher-education")}
              className="mt-5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Manage Higher Education
            </button>
          </div>

          {/* Alumni */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
              <span className="text-xl font-bold text-purple-600">
                A
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-800">
              Alumni Contributions
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Manage alumni meetings, academic and financial
              contributions.
            </p>

            <button
              onClick={() => router.push("/alumni")}
              className="mt-5 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              Manage Alumni
            </button>
          </div>

        </div>
      </section>
    </main>
  );
}