"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";

type Student = {
  id: string;
  full_name: string;
  roll_number: string;
  batch: string;
  section: string | null;
  branch: string | null;
  graduation_year: number | null;
  created_at?: string;
  updated_at?: string;
};

type ImportRow = {
  full_name: string;
  roll_number: string;
  batch: string;
  section: string;
  branch: string;
  graduation_year: string;
  error?: string;
};

const BRANCHES = [
  "Mechanical",
  "CSE",
  "ECE",
  "EEE",
  "Chemical",
  "IT",
  "CSE (AI-ML)",
  "CSE (Data Science)",
  "CSE (Cyber Security)",
  "Bio-Technology",
];

const SECTIONS = ["A", "B", "C", "D", "E", "F"];

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [batch, setBatch] = useState("");
  const [section, setSection] = useState("");
  const [branch, setBranch] = useState("Mechanical");
  const [graduationYear, setGraduationYear] = useState("");

  const [searchText, setSearchText] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterBatch, setFilterBatch] = useState("");

  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    setLoading(true);

    const { data, error } = await supabase
      .from("students")
      .select(
        "id,full_name,roll_number,batch,section,branch,graduation_year,created_at,updated_at"
      )
      .order("full_name", { ascending: true });

    if (error) {
      console.error(error);
      alert(error.message);
    } else {
      setStudents((data || []) as Student[]);
    }

    setLoading(false);
  }

  function resetForm() {
    setFullName("");
    setRollNumber("");
    setBatch("");
    setSection("");
    setBranch("Mechanical");
    setGraduationYear("");
    setEditingId(null);
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function cancelForm() {
    resetForm();
    setShowForm(false);
  }

  function editStudent(student: Student) {
    setEditingId(student.id);
    setFullName(student.full_name || "");
    setRollNumber(student.roll_number || "");
    setBatch(student.batch || "");
    setSection(student.section || "");
    setBranch(student.branch || "Mechanical");
    setGraduationYear(student.graduation_year?.toString() || "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveStudent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!rollNumber.trim()) {
      alert("Roll Number is mandatory.");
      return;
    }

    setSaving(true);

    const payload = {
      full_name: fullName.trim(),
      roll_number: rollNumber.trim(),
      batch: batch.trim(),
      section: section.trim() || null,
      branch: branch.trim() || null,
      graduation_year: graduationYear ? Number(graduationYear) : null,
    };

    let error;

    if (editingId) {
      const result = await supabase
        .from("students")
        .update(payload)
        .eq("id", editingId);

      error = result.error;
    } else {
      const result = await supabase.from("students").insert(payload);
      error = result.error;
    }

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert(editingId ? "Student updated successfully." : "Student added successfully.");
    cancelForm();
    await loadStudents();
  }

  async function deleteStudent(id: string) {
    if (!confirm("Are you sure you want to delete this student?")) {
      return;
    }

    const { error } = await supabase.from("students").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setStudents((prev) => prev.filter((student) => student.id !== id));
  }

  const batches = useMemo(
    () =>
      Array.from(
        new Set(
          students
            .map((student) => student.batch)
            .filter(Boolean)
        )
      ).sort(),
    [students]
  );

  const filteredStudents = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return students.filter((student) => {
      const searchable = [
        student.full_name,
        student.roll_number,
        student.batch,
        student.section,
        student.branch,
        student.graduation_year?.toString(),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!search || searchable.includes(search)) &&
        (!filterBranch || student.branch === filterBranch) &&
        (!filterSection || student.section === filterSection) &&
        (!filterBatch || student.batch === filterBatch)
      );
    });
  }, [students, searchText, filterBranch, filterSection, filterBatch]);

  function clearFilters() {
    setSearchText("");
    setFilterBranch("");
    setFilterSection("");
    setFilterBatch("");
  }

  function exportStudents() {
    const rows = filteredStudents.map((student) => ({
      "Student Name": student.full_name,
      "Roll Number": student.roll_number,
      Batch: student.batch,
      Section: student.section || "",
      Branch: student.branch || "",
      "Graduation Year": student.graduation_year || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, "ANITS_Student_List.xlsx");
  }

  function normalizeHeader(value: unknown) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");
  }

  function getValue(
    row: Record<string, unknown>,
    possibleHeaders: string[]
  ) {
    const normalized = new Map(
      Object.entries(row).map(([key, value]) => [
        normalizeHeader(key),
        value,
      ])
    );

    for (const header of possibleHeaders) {
      const value = normalized.get(normalizeHeader(header));
      if (value !== undefined && value !== null) {
        return String(value).trim();
      }
    }

    return "";
  }

  async function handleExcelFile(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        firstSheet,
        { defval: "" }
      );

      if (rawRows.length === 0) {
        alert("The Excel file is empty.");
        return;
      }

      const existingRollNumbers = new Set(
        students.map((student) => student.roll_number.trim().toLowerCase())
      );

      const seenInFile = new Set<string>();

      const parsedRows: ImportRow[] = rawRows.map((row) => {
        const full_name = getValue(row, [
          "Student Name",
          "Name",
          "Full Name",
        ]);

        const roll_number = getValue(row, [
          "Roll Number",
          "Roll No",
          "Roll No.",
          "Registered Number",
        ]);

        const batch = getValue(row, ["Batch"]);
        const section = getValue(row, ["Section"]);
        const branch = getValue(row, [
          "Branch",
          "Department",
        ]);

        const graduation_year = getValue(row, [
          "Graduation Year",
          "Passing Year",
          "Year of Completion",
        ]);

        const normalizedRoll = roll_number.toLowerCase();

        let error = "";

        if (!roll_number) {
          error = "Roll Number is missing";
        } else if (existingRollNumbers.has(normalizedRoll)) {
          error = "Roll Number already exists";
        } else if (seenInFile.has(normalizedRoll)) {
          error = "Duplicate Roll Number in Excel";
        } else if (!full_name) {
          error = "Student Name is missing";
        } else if (!batch) {
          error = "Batch is missing";
        }

        if (normalizedRoll) {
          seenInFile.add(normalizedRoll);
        }

        return {
          full_name,
          roll_number,
          batch,
          section,
          branch,
          graduation_year,
          error,
        };
      });

      setImportRows(parsedRows);
      setShowImport(true);
    } catch (error) {
      console.error(error);
      alert("Unable to read the Excel file.");
    }

    event.target.value = "";
  }

  const validImportRows = importRows.filter((row) => !row.error);

  async function importStudents() {
    if (validImportRows.length === 0) {
      alert("There are no valid records to import.");
      return;
    }

    setImporting(true);

    const payload = validImportRows.map((row) => ({
      full_name: row.full_name,
      roll_number: row.roll_number,
      batch: row.batch,
      section: row.section || null,
      branch: row.branch || null,
      graduation_year: row.graduation_year
        ? Number(row.graduation_year)
        : null,
    }));

    const { error } = await supabase.from("students").insert(payload);

    setImporting(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert(`${validImportRows.length} student(s) imported successfully.`);
    setImportRows([]);
    setShowImport(false);
    await loadStudents();
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8 flex items-center justify-between border-b bg-white px-6 py-5 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold">ANITS</h1>
            <p className="text-sm text-slate-500">
              Student Higher Education Database
            </p>
          </div>

          <a
            href="/admin"
            className="rounded-lg bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white"
          >
            ← Dashboard
          </a>
        </header>

        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Manage Students</h2>
            <p className="mt-1 text-slate-500">
              Student basic records only. Higher Education and Entrance Exam
              records are managed separately.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleExcelFile}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
            >
              📥 Import Excel
            </button>

            <button
              type="button"
              onClick={exportStudents}
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              📊 Export Excel
            </button>

            <button
              type="button"
              onClick={openAddForm}
              className="rounded-lg bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600"
            >
              + Add Student
            </button>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={saveStudent}
            className="mb-7 rounded-xl bg-white p-6 shadow-sm"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">
                  {editingId ? "Edit Student" : "Add Student"}
                </h3>
                <p className="text-sm text-slate-500">
                  Roll Number is mandatory. Other fields can be entered manually.
                </p>
              </div>

              <button
                type="button"
                onClick={cancelForm}
                className="rounded-lg border px-4 py-2"
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Student Name">
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input"
                  placeholder="Student Name"
                />
              </Field>

              <Field label="Roll Number *">
                <input
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="input"
                  placeholder="Roll Number"
                />
              </Field>

              <Field label="Batch">
                <input
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  className="input"
                  placeholder="2020-2024"
                />
              </Field>

              <Field label="Section">
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="input"
                  placeholder="A / B / C"
                />
              </Field>

              <Field label="Branch">
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="input"
                >
                  {BRANCHES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>

              <Field label="Graduation / Passing Year">
                <input
                  type="number"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="input"
                  placeholder="2024"
                />
              </Field>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Student"
                  : "Save Student"}
              </button>

              <button
                type="button"
                onClick={cancelForm}
                className="rounded-lg border px-6 py-3 font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {showImport && (
          <section className="mb-7 rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">
                  Excel Import Preview
                </h3>
                <p className="text-sm text-slate-500">
                  {importRows.length} records found ·{" "}
                  {validImportRows.length} valid ·{" "}
                  {importRows.length - validImportRows.length} with errors
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowImport(false);
                  setImportRows([]);
                }}
                className="rounded-lg border px-4 py-2"
              >
                Cancel Import
              </button>
            </div>

            <div className="mb-4 overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left">
                    <th className="border p-3">Student Name</th>
                    <th className="border p-3">Roll Number</th>
                    <th className="border p-3">Batch</th>
                    <th className="border p-3">Section</th>
                    <th className="border p-3">Branch</th>
                    <th className="border p-3">Graduation Year</th>
                    <th className="border p-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {importRows.map((row, index) => (
                    <tr key={`${row.roll_number}-${index}`}>
                      <td className="border p-3">{row.full_name || "-"}</td>
                      <td className="border p-3">{row.roll_number || "-"}</td>
                      <td className="border p-3">{row.batch || "-"}</td>
                      <td className="border p-3">{row.section || "-"}</td>
                      <td className="border p-3">{row.branch || "-"}</td>
                      <td className="border p-3">
                        {row.graduation_year || "-"}
                      </td>
                      <td
                        className={`border p-3 font-semibold ${
                          row.error ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {row.error || "✓ Valid"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={importing || validImportRows.length === 0}
                onClick={importStudents}
                className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white disabled:opacity-50"
              >
                {importing
                  ? "Importing..."
                  : `Import ${validImportRows.length} Valid Students`}
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border px-6 py-3 font-semibold"
              >
                Choose Another Excel
              </button>
            </div>
          </section>
        )}

        <section className="mb-7 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Search & Filter Students</h3>
              <p className="text-sm text-slate-500">
                Search and organize students by branch, section and batch.
              </p>
            </div>

            <strong className="text-sm">
              Showing {filteredStudents.length} of {students.length}
            </strong>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Search">
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="input"
                placeholder="Name / Roll Number / Batch"
              />
            </Field>

            <Field label="Branch">
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="input"
              >
                <option value="">All Branches</option>
                {BRANCHES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>

            <Field label="Section">
              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="input"
              >
                <option value="">All Sections</option>
                {SECTIONS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>

            <Field label="Batch">
              <select
                value={filterBatch}
                onChange={(e) => setFilterBatch(e.target.value)}
                className="input"
              >
                <option value="">All Batches</option>
                {batches.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border px-5 py-2 font-semibold"
            >
              Clear Filters
            </button>
          </div>
        </section>

        <section className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="border p-3">Student Name</th>
                <th className="border p-3">Roll Number</th>
                <th className="border p-3">Batch</th>
                <th className="border p-3">Section</th>
                <th className="border p-3">Branch</th>
                <th className="border p-3">Graduation Year</th>
                <th className="border p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    Loading students...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No students found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="border p-3">{student.full_name}</td>
                    <td className="border p-3">{student.roll_number}</td>
                    <td className="border p-3">{student.batch}</td>
                    <td className="border p-3">{student.section || "-"}</td>
                    <td className="border p-3">{student.branch || "-"}</td>
                    <td className="border p-3">
                      {student.graduation_year || "-"}
                    </td>
                    <td className="border p-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => editStudent(student)}
                          className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteStudent(student.id)}
                          className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <section className="mt-6 rounded-xl border border-dashed bg-white p-5 text-sm text-slate-600">
          <strong>Excel format:</strong>{" "}
          Student Name | Roll Number | Batch | Section | Branch | Graduation Year
        </section>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px 12px;
          outline: none;
          background: white;
        }

        .input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}
