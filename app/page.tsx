export default function Home() {
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
              Anil Neerukonda Institute of Technology & Sciences
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium text-slate-600">
              Student Database
            </p>

            <p className="text-xs text-slate-400">
              Higher Education & Alumni Records
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <section className="mx-auto flex min-h-[calc(100vh-90px)] max-w-6xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl">

          {/* Heading */}
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600">
              ANITS
            </p>

            <h2 className="text-4xl font-bold tracking-tight text-slate-800">
              Student Higher Education Database
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-500">
              Manage student examination records, higher education details,
              and alumni contributions in one place.
            </p>
          </div>

          {/* Login Cards */}
          <div className="grid gap-6 md:grid-cols-2">

            {/* Admin */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md">

              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50">
                <span className="text-2xl font-semibold text-blue-600">
                  A
                </span>
              </div>

              <h3 className="text-xl font-semibold text-slate-800">
                Admin Login
              </h3>

              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                Full access to student records, higher education data,
                alumni information, users, import, export, and printing.
              </p>

              <a
                href="/admin-login"
                className="mt-6 block w-full rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Admin Login
              </a>
            </div>

            {/* User */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md">

              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100">
                <span className="text-2xl font-semibold text-slate-600">
                  U
                </span>
              </div>

              <h3 className="text-xl font-semibold text-slate-800">
                User Login
              </h3>

              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                View student information, search records, filter data,
                open proof documents, and print reports.
              </p>

              {/* User Login → User Login Page */}
              <a
                href="/user-login"
                className="mt-6 block w-full rounded-lg border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                User Login
              </a>
            </div>
          </div>

          {/* Sections */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">

            <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
              <p className="font-semibold text-slate-800">
                GATE / CAT / IELTS
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Examination Records
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
              <p className="font-semibold text-slate-800">
                Higher Education
              </p>

              <p className="mt-1 text-xs text-slate-500">
                PG / PhD Records
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
              <p className="font-semibold text-slate-800">
                Alumni Contribution
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Alumni Activities
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-4 text-center">
        <p className="text-xs text-slate-400">
          ANITS Student Higher Education Database
        </p>
      </footer>
    </main>
  );
}