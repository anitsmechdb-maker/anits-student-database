"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";

type HigherEducationRecord = {
  id: string;
  student_name: string | null;
  registered_number: string | null;
  student_batch: string | null;
  graduation_year: number | null;
  program_level: string | null;
  program_name: string | null;
  university_name: string | null;
  admission_year: number | null;
  examination: string | null;
  score: number | null;
  score_type: string | null;
  rank: string | null;
  proof_link: string | null;
  remarks: string | null;
};

const emptyForm = {
  studentName: "",
  registeredNumber: "",
  studentBatch: "",
  graduationYear: "",
  programLevel: "",
  programName: "",
  universityName: "",
  admissionYear: "",
  examination: "",
  score: "",
  scoreType: "",
  rank: "",
  proofLink: "",
  remarks: "",
};

export default function HigherEducationPage() {
  const [records, setRecords] = useState<HigherEducationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [studentName, setStudentName] = useState("");
  const [registeredNumber, setRegisteredNumber] = useState("");
  const [studentBatch, setStudentBatch] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [programLevel, setProgramLevel] = useState("");
  const [programName, setProgramName] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [admissionYear, setAdmissionYear] = useState("");
  const [examination, setExamination] = useState("");
  const [score, setScore] = useState("");
  const [scoreType, setScoreType] = useState("");
  const [rank, setRank] = useState("");
  const [proofLink, setProofLink] = useState("");
  const [remarks, setRemarks] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [filterProgramLevel, setFilterProgramLevel] = useState("");
  const [filterProgramName, setFilterProgramName] = useState("");
  const [filterAdmissionYear, setFilterAdmissionYear] = useState("");
  const [filterBatch, setFilterBatch] = useState("");

  useEffect(() => {
    loadRecords();
  }, []);

  async function loadRecords() {
    setLoading(true);

    const { data, error } = await supabase
      .from("higher_education")
      .select(
        "id,student_name,registered_number,student_batch,graduation_year,program_level,program_name,university_name,admission_year,examination,score,score_type,rank,proof_link,remarks"
      )
      .order("admission_year", { ascending: false });

    if (error) {
      console.error(error);
      alert(error.message);
    } else {
      setRecords((data || []) as HigherEducationRecord[]);
    }

    setLoading(false);
  }

  function resetForm() {
    setStudentName("");
    setRegisteredNumber("");
    setStudentBatch("");
    setGraduationYear("");
    setProgramLevel("");
    setProgramName("");
    setUniversityName("");
    setAdmissionYear("");
    setExamination("");
    setScore("");
    setScoreType("");
    setRank("");
    setProofLink("");
    setRemarks("");
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

  function editRecord(item: HigherEducationRecord) {
    setEditingId(item.id);
    setStudentName(item.student_name || "");
    setRegisteredNumber(item.registered_number || "");
    setStudentBatch(item.student_batch || "");
    setGraduationYear(item.graduation_year?.toString() || "");
    setProgramLevel(item.program_level || "");
    setProgramName(item.program_name || "");
    setUniversityName(item.university_name || "");
    setAdmissionYear(item.admission_year?.toString() || "");
    setExamination(item.examination || "");
    setScore(item.score?.toString() || "");
    setScoreType(item.score_type || "");
    setRank(item.rank || "");
    setProofLink(item.proof_link || "");
    setRemarks(item.remarks || "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteRecord(id: string) {
    if (!confirm("Are you sure you want to delete this Higher Education record?")) {
      return;
    }

    const { error } = await supabase
      .from("higher_education")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setRecords((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      student_name: studentName.trim() || null,
      registered_number: registeredNumber.trim() || null,
      student_batch: studentBatch.trim() || null,
      graduation_year: graduationYear ? Number(graduationYear) : null,
      program_level: programLevel.trim() || null,
      program_name: programName.trim() || null,
      university_name: universityName.trim() || null,
      admission_year: admissionYear ? Number(admissionYear) : null,
      examination: examination.trim() || null,
      score: score ? Number(score) : null,
      score_type: scoreType.trim() || null,
      rank: rank.trim() || null,
      proof_link: proofLink.trim() || null,
      remarks: remarks.trim() || null,
    };

    let error;

    if (editingId) {
      const result = await supabase
        .from("higher_education")
        .update(payload)
        .eq("id", editingId);

      error = result.error;
    } else {
      const result = await supabase
        .from("higher_education")
        .insert(payload);

      error = result.error;
    }

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert(editingId ? "Record updated successfully." : "Record added successfully.");
    cancelForm();
    await loadRecords();
  }

  const programLevels = useMemo(
    () =>
      Array.from(
        new Set(
          records
            .map((item) => item.program_level)
            .filter((value): value is string => Boolean(value))
        )
      ).sort(),
    [records]
  );

  const programNames = useMemo(
    () =>
      Array.from(
        new Set(
          records
            .map((item) => item.program_name)
            .filter((value): value is string => Boolean(value))
        )
      ).sort(),
    [records]
  );

  const admissionYears = useMemo(
    () =>
      Array.from(
        new Set(
          records
            .map((item) => item.admission_year)
            .filter((value): value is number => value !== null)
        )
      ).sort((a, b) => b - a),
    [records]
  );

  const batches = useMemo(
    () =>
      Array.from(
        new Set(
          records
            .map((item) => item.student_batch)
            .filter((value): value is string => Boolean(value))
        )
      ).sort(),
    [records]
  );

  const filteredRecords = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return records.filter((item) => {
      const searchable = [
        item.student_name,
        item.registered_number,
        item.student_batch,
        item.program_level,
        item.program_name,
        item.university_name,
        item.examination,
        item.score_type,
        item.rank,
        item.remarks,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !search || searchable.includes(search);
      const matchesLevel =
        !filterProgramLevel || item.program_level === filterProgramLevel;
      const matchesProgram =
        !filterProgramName || item.program_name === filterProgramName;
      const matchesYear =
        !filterAdmissionYear ||
        item.admission_year?.toString() === filterAdmissionYear;
      const matchesBatch =
        !filterBatch || item.student_batch === filterBatch;

      return (
        matchesSearch &&
        matchesLevel &&
        matchesProgram &&
        matchesYear &&
        matchesBatch
      );
    });
  }, [
    records,
    searchText,
    filterProgramLevel,
    filterProgramName,
    filterAdmissionYear,
    filterBatch,
  ]);

  function clearFilters() {
    setSearchText("");
    setFilterProgramLevel("");
    setFilterProgramName("");
    setFilterAdmissionYear("");
    setFilterBatch("");
  }

  function exportToExcel() {
    const rows = filteredRecords.map((item) => ({
      "Student Name": item.student_name || "",
      "Registered Number": item.registered_number || "",
      Batch: item.student_batch || "",
      "Graduation Year": item.graduation_year || "",
      "Program Level": item.program_level || "",
      "Program Name": item.program_name || "",
      "University / Institution": item.university_name || "",
      "Admission Year": item.admission_year || "",
      Examination: item.examination || "",
      Score: item.score ?? "",
      "Score Type": item.score_type || "",
      Rank: item.rank || "",
      "Proof Link": item.proof_link || "",
      Remarks: item.remarks || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Higher Education"
    );

    XLSX.writeFile(
      workbook,
      "ANITS_Higher_Education_Records.xlsx"
    );
  }

  function handlePrint() {
    window.print();
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .print-only {
            display: block !important;
          }

          .print-table {
            display: table !important;
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 9px !important;
          }

          .print-table th,
          .print-table td {
            border: 1px solid #555 !important;
            padding: 4px !important;
            vertical-align: top !important;
          }

          .print-letterhead {
            display: block !important;
            margin-bottom: 12px !important;
          }

          .screen-table {
            display: none !important;
          }
        }

        @media screen {
          .print-only {
            display: none;
          }

          .print-table {
            display: none;
          }
        }
      `}</style>

      <div className="no-print mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between border-b pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">ANITS</h1>
            <p className="text-sm text-slate-500">
              Student Higher Education Database
            </p>
          </div>

          <a
            href="/admin"
            className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white"
          >
            ← Dashboard
          </a>
        </div>

        <div className="mb-7 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">
              Higher Education Students
            </h2>
            <p className="mt-1 text-slate-500">
              Manage higher education records independently from the Students database.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
          >
            + Add Higher Education Record
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSave}
            className="mb-8 rounded-xl border bg-white p-6 shadow-sm"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">
                  {editingId
                    ? "Edit Higher Education Record"
                    : "Add Higher Education Record"}
                </h3>
                <p className="text-sm text-slate-500">
                  All fields are optional.
                </p>
              </div>

              <button
                type="button"
                onClick={cancelForm}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Student Name">
                <input
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="input"
                />
              </Field>

              <Field label="Registered Number">
                <input
                  value={registeredNumber}
                  onChange={(e) => setRegisteredNumber(e.target.value)}
                  className="input"
                />
              </Field>

              <Field label="Batch">
                <input
                  value={studentBatch}
                  onChange={(e) => setStudentBatch(e.target.value)}
                  className="input"
                  placeholder="2020-2024"
                />
              </Field>

              <Field label="Graduation / Passing Year">
                <input
                  type="number"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="input"
                />
              </Field>

              <Field label="Program Level">
                <select
                  value={programLevel}
                  onChange={(e) => setProgramLevel(e.target.value)}
                  className="input"
                >
                  <option value="">Select</option>
                  <option>B.Tech</option>
                  <option>M.Tech</option>
                  <option>M.E.</option>
                  <option>MBA</option>
                  <option>MCA</option>
                  <option>MS</option>
                  <option>PhD</option>
                  <option>Other</option>
                </select>
              </Field>

              <Field label="Program Name">
                <input
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  className="input"
                  placeholder="M.Tech CAD/CAM"
                />
              </Field>

              <Field label="University / Institution">
                <input
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                  className="input"
                />
              </Field>

              <Field label="Admission Year">
                <input
                  type="number"
                  value={admissionYear}
                  onChange={(e) => setAdmissionYear(e.target.value)}
                  className="input"
                />
              </Field>

              <Field label="Entrance Examination">
                <select
                  value={examination}
                  onChange={(e) => setExamination(e.target.value)}
                  className="input"
                >
                  <option value="">Select</option>
                  <option>GATE</option>
                  <option>CAT</option>
                  <option>IELTS</option>
                  <option>TOEFL</option>
                  <option>GRE</option>
                  <option>GMAT</option>
                  <option>Other</option>
                </select>
              </Field>

              <Field label="Score">
                <input
                  type="number"
                  step="any"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="input"
                />
              </Field>

              <Field label="Score Type">
                <input
                  value={scoreType}
                  onChange={(e) => setScoreType(e.target.value)}
                  className="input"
                  placeholder="Score / Percentage / CGPA / Band"
                />
              </Field>

              <Field label="Rank">
                <input
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                  className="input"
                />
              </Field>

              <Field label="Proof Link">
                <input
                  type="text"
                  value={proofLink}
                  onChange={(e) => setProofLink(e.target.value)}
                  className="input"
                  placeholder="Google Drive link"
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Remarks">
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="input min-h-24"
                  />
                </Field>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Record"
                  : "Save Record"}
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

        <div className="mb-7 rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">
                Search & Filter Higher Education Records
              </h3>
              <p className="text-sm text-slate-500">
                Search by student, roll number, university, program, examination or rank.
              </p>
            </div>

            <strong className="text-sm">
              Showing {filteredRecords.length} of {records.length} records
            </strong>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            <Field label="Search">
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="input"
                placeholder="Search student / university / program / rank"
              />
            </Field>

            <Field label="Program Level">
              <select
                value={filterProgramLevel}
                onChange={(e) => setFilterProgramLevel(e.target.value)}
                className="input"
              >
                <option value="">All Levels</option>
                {programLevels.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>

            <Field label="Program">
              <select
                value={filterProgramName}
                onChange={(e) => setFilterProgramName(e.target.value)}
                className="input"
              >
                <option value="">All Programs</option>
                {programNames.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>

            <Field label="Admission Year">
              <select
                value={filterAdmissionYear}
                onChange={(e) => setFilterAdmissionYear(e.target.value)}
                className="input"
              >
                <option value="">All Years</option>
                {admissionYears.map((year) => (
                  <option key={year}>{year}</option>
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

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border px-4 py-2 font-semibold"
            >
              Clear Filters
            </button>

            <button
              type="button"
              onClick={exportToExcel}
              className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white"
            >
              Export to Excel
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white"
            >
              🖨️ Print Preview
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm screen-table">
          <table className="w-full min-w-[1300px] border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="border p-3">Student Name</th>
                <th className="border p-3">Registered No.</th>
                <th className="border p-3">Batch</th>
                <th className="border p-3">Program</th>
                <th className="border p-3">University</th>
                <th className="border p-3">Admission Year</th>
                <th className="border p-3">Examination</th>
                <th className="border p-3">Score</th>
                <th className="border p-3">Rank</th>
                <th className="border p-3">Proof</th>
                <th className="border p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center">
                    Loading...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500">
                    No Higher Education records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="border p-3">{item.student_name || "-"}</td>
                    <td className="border p-3">
                      {item.registered_number || "-"}
                    </td>
                    <td className="border p-3">
                      {item.student_batch || "-"}
                    </td>
                    <td className="border p-3">
                      <div>{item.program_level || "-"}</div>
                      <div className="text-xs text-slate-500">
                        {item.program_name || ""}
                      </div>
                    </td>
                    <td className="border p-3">
                      {item.university_name || "-"}
                    </td>
                    <td className="border p-3">
                      {item.admission_year || "-"}
                    </td>
                    <td className="border p-3">
                      {item.examination || "-"}
                    </td>
                    <td className="border p-3">
                      {item.score !== null
                        ? `${item.score}${item.score_type ? ` (${item.score_type})` : ""}`
                        : "-"}
                    </td>
                    <td className="border p-3">{item.rank || "-"}</td>
                    <td className="border p-3">
                      {item.proof_link ? (
                        <a
                          href={item.proof_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-blue-600 underline"
                        >
                          View Proof
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="border p-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => editRecord(item)}
                          className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRecord(item.id)}
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
        </div>
      </div>

      <div className="print-only print-letterhead">
        <div className="border-b-2 border-black pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-20 items-center justify-center border border-black text-xs font-bold">
              ANITS
            </div>
            <div className="flex-1 text-center">
              <div className="text-lg font-bold">
                Anil Neerukonda Institute of Technology & Sciences (Autonomous)
              </div>
              <div className="text-xs">
                Affiliated to AU, Approved by AICTE & Accredited by NAAC with A+ Grade
              </div>
              <div className="text-xs">
                Accredited by NBA (B.Tech – ECE, EEE, CSE, IT, MECH, Civil & Chemical)
              </div>
              <div className="mt-1 text-xs">
                Sangivalasa-531 162, Bheemunipatnam Mandal, Visakhapatnam District
              </div>
              <div className="text-xs">
                Phone: 8712005999, 8712008222 | Website: www.anits.edu.in
              </div>
            </div>
          </div>
        </div>

        <h2 className="mt-3 text-center text-base font-bold underline">
          DEPARTMENT OF MECHANICAL ENGINEERING
        </h2>

        <h3 className="mt-3 text-center text-sm font-bold">
          HIGHER EDUCATION STUDENT RECORDS
        </h3>
      </div>

      <table className="print-only print-table">
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Registered No.</th>
            <th>Batch</th>
            <th>Program</th>
            <th>University</th>
            <th>Admission Year</th>
            <th>Examination</th>
            <th>Score</th>
            <th>Rank</th>
            <th>Proof</th>
          </tr>
        </thead>
        <tbody>
          {filteredRecords.map((item) => (
            <tr key={item.id}>
              <td>{item.student_name || "-"}</td>
              <td>{item.registered_number || "-"}</td>
              <td>{item.student_batch || "-"}</td>
              <td>
                {item.program_level || "-"}
                {item.program_name ? ` / ${item.program_name}` : ""}
              </td>
              <td>{item.university_name || "-"}</td>
              <td>{item.admission_year || "-"}</td>
              <td>{item.examination || "-"}</td>
              <td>
                {item.score !== null ? item.score : "-"}
                {item.score_type ? ` (${item.score_type})` : ""}
              </td>
              <td>{item.rank || "-"}</td>
              <td>{item.proof_link || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

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
