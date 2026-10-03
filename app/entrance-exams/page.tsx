"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";

type ExamRecord = {
  id: string;
  student_name: string | null;
  registered_number: string | null;
  student_batch: string | null;
  exam_type: string | null;
  exam_year: number | null;
  score: number | null;
  score_type: string | null;
  gate_me_score: number | null;
  gate_xe_score: number | null;
  rank: string | null;
  proof_link: string | null;
  remarks: string | null;
};

export default function EntranceExamsPage() {
  const [records, setRecords] = useState<ExamRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [studentName, setStudentName] = useState("");
  const [registeredNumber, setRegisteredNumber] = useState("");
  const [studentBatch, setStudentBatch] = useState("");
  const [examType, setExamType] = useState("");
  const [examYear, setExamYear] = useState("");

  const [scoreType, setScoreType] = useState("");
  const [score, setScore] = useState("");

  const [gateMeScore, setGateMeScore] = useState("");
  const [gateXeScore, setGateXeScore] = useState("");

  const [rank, setRank] = useState("");
  const [proofLink, setProofLink] = useState("");
  const [remarks, setRemarks] = useState("");

  // Search & Filter
  const [searchText, setSearchText] = useState("");
  const [filterExamType, setFilterExamType] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterBatch, setFilterBatch] = useState("");

  useEffect(() => {
    loadExamRecords();
  }, []);

  async function loadExamRecords() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("exam_records")
      .select(`
        id,
        student_name,
        registered_number,
        student_batch,
        exam_type,
        exam_year,
        score,
        score_type,
        gate_me_score,
        gate_xe_score,
        rank,
        proof_link,
        remarks
      `)
      .order("exam_year", { ascending: false });

    if (error) {
      console.error(error);
      setError(error.message);
      setLoading(false);
      return;
    }

    setRecords(data || []);
    setLoading(false);
  }

  function resetForm() {
    setStudentName("");
    setRegisteredNumber("");
    setStudentBatch("");
    setExamType("");
    setExamYear("");

    setScoreType("");
    setScore("");

    setGateMeScore("");
    setGateXeScore("");

    setRank("");
    setProofLink("");
    setRemarks("");

    setError("");
  }

  function startEdit(record: ExamRecord) {
    setEditingId(record.id);
    setShowForm(true);
    setError("");

    setStudentName(record.student_name || "");
    setRegisteredNumber(record.registered_number || "");
    setStudentBatch(record.student_batch || "");
    setExamType(record.exam_type || "");
    setExamYear(record.exam_year ? String(record.exam_year) : "");
    setScoreType(record.score_type || "");
    setScore(record.score !== null ? String(record.score) : "");
    setGateMeScore(record.gate_me_score !== null ? String(record.gate_me_score) : "");
    setGateXeScore(record.gate_xe_score !== null ? String(record.gate_xe_score) : "");
    setRank(record.rank || "");
    setProofLink(record.proof_link || "");
    setRemarks(record.remarks || "");
  }

  function cancelEdit() {
    setEditingId(null);
    resetForm();
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this examination record?")) {
      return;
    }

    setDeletingId(id);
    setError("");

    const { error } = await supabase
      .from("exam_records")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      setError(error.message);
      setDeletingId(null);
      return;
    }

    if (editingId === id) {
      cancelEdit();
    }

    await loadExamRecords();
    setDeletingId(null);
  }

  async function handleSave(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setSaving(true);
    setError("");

    const recordData = {
        student_name:
          studentName.trim() || null,

        registered_number:
          registeredNumber.trim() || null,

        student_batch:
          studentBatch.trim() || null,

        exam_type:
          examType || null,

        exam_year:
          examYear
            ? Number(examYear)
            : null,

        score_type:
          examType === "GATE"
            ? null
            : scoreType.trim() || null,

        score:
          examType === "GATE"
            ? null
            : score
              ? Number(score)
              : null,

        gate_me_score:
          examType === "GATE" && gateMeScore
            ? Number(gateMeScore)
            : null,

        gate_xe_score:
          examType === "GATE" && gateXeScore
            ? Number(gateXeScore)
            : null,

        rank:
          rank.trim() || null,

        proof_link:
          proofLink.trim() || null,

        remarks:
          remarks.trim() || null,
      };

    const { error } = editingId
      ? await supabase
          .from("exam_records")
          .update(recordData)
          .eq("id", editingId)
      : await supabase
          .from("exam_records")
          .insert({ student_id: null, ...recordData });

    if (error) {
      console.error(error);
      setError(error.message);
      setSaving(false);
      return;
    }

    resetForm();
    setEditingId(null);
    setShowForm(false);

    await loadExamRecords();

    setSaving(false);
  }

  const filteredRecords = records.filter((record) => {
    const query = searchText.trim().toLowerCase();

    const matchesSearch =
      !query ||
      (record.student_name || "").toLowerCase().includes(query) ||
      (record.registered_number || "").toLowerCase().includes(query) ||
      (record.student_batch || "").toLowerCase().includes(query) ||
      (record.exam_type || "").toLowerCase().includes(query) ||
      (record.rank || "").toLowerCase().includes(query);

    const matchesExam =
      !filterExamType || record.exam_type === filterExamType;

    const matchesYear =
      !filterYear || String(record.exam_year ?? "") === filterYear;

    const matchesBatch =
      !filterBatch || record.student_batch === filterBatch;

    return matchesSearch && matchesExam && matchesYear && matchesBatch;
  });

  const examTypes = Array.from(
    new Set(records.map((record) => record.exam_type).filter(Boolean))
  ) as string[];

  const examYears = Array.from(
    new Set(records.map((record) => record.exam_year).filter(Boolean))
  ).sort((a, b) => Number(b) - Number(a));

  const batches = Array.from(
    new Set(records.map((record) => record.student_batch).filter(Boolean))
  ).sort();

  function clearFilters() {
    setSearchText("");
    setFilterExamType("");
    setFilterYear("");
    setFilterBatch("");
  }

  function exportToExcel() {
    const exportData = filteredRecords.map((record) => ({
      "Student Name": record.student_name || "",
      "Registered Number": record.registered_number || "",
      "Batch": record.student_batch || "",
      "Examination": record.exam_type || "",
      "Year": record.exam_year ?? "",
      "GATE ME Score": record.gate_me_score ?? "",
      "GATE XE Score": record.gate_xe_score ?? "",
      "Score Type": record.score_type || "",
      "Score": record.score ?? "",
      "Rank": record.rank || "",
      "Proof Link": record.proof_link || "",
      "Remarks": record.remarks || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Entrance Exam Records"
    );

    XLSX.writeFile(
      workbook,
      "ANITS_Entrance_Exam_Records.xlsx"
    );
  }

  function handlePrint() {
    window.print();
  }

  return (
    <main className="min-h-screen bg-slate-100">

      {/* HEADER */}
      <header className="border-b bg-white shadow-sm print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              ANITS
            </h1>

            <p className="text-sm text-slate-500">
              Student Higher Education Database
            </p>
          </div>

          <a
            href="/admin"
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            ← Dashboard
          </a>

        </div>
      </header>

      {/* MAIN */}
      <section className="mx-auto max-w-7xl px-6 py-10">

        {/* PAGE TITLE */}
        <div className="mb-8 flex items-center justify-between print:hidden">

          <div>
            <h2 className="text-3xl font-bold text-slate-800">
              Entrance Examinations & Ranks
            </h2>

            <p className="mt-2 text-slate-500">
              Manage GATE, CAT, IELTS and other entrance examination records.
            </p>
          </div>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setError("");
            }}
            className="rounded-lg bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            {showForm
              ? "Close Form"
              : "+ Add Exam Record"}
          </button>

        </div>

        {/* FORM */}
        {showForm && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm print:hidden">

            <h3 className="mb-7 text-xl font-bold text-slate-800">
              {editingId ? "Edit Entrance Examination Record" : "Add Entrance Examination Record"}
            </h3>

            <form
              onSubmit={handleSave}
              className="space-y-6"
            >

              {/* STUDENT NAME + REGISTERED NUMBER */}
              <div className="grid gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Student Name
                  </label>

                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) =>
                      setStudentName(e.target.value)
                    }
                    placeholder="Enter student name"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Registered Number
                  </label>

                  <input
                    type="text"
                    value={registeredNumber}
                    onChange={(e) =>
                      setRegisteredNumber(e.target.value)
                    }
                    placeholder="Enter registered number"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

              </div>

              {/* BATCH + EXAMINATION */}
              <div className="grid gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Student Batch
                  </label>

                  <input
                    type="text"
                    value={studentBatch}
                    onChange={(e) =>
                      setStudentBatch(e.target.value)
                    }
                    placeholder="Example: 2021-2025"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Examination
                  </label>

                  <select
                    value={examType}
                    onChange={(e) => {
                      const value = e.target.value;

                      setExamType(value);

                      setScoreType("");
                      setScore("");
                      setGateMeScore("");
                      setGateXeScore("");
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="">
                      Select Examination
                    </option>

                    <option value="GATE">
                      GATE
                    </option>

                    <option value="CAT">
                      CAT
                    </option>

                    <option value="IELTS">
                      IELTS
                    </option>

                    <option value="TOEFL">
                      TOEFL
                    </option>

                    <option value="GRE">
                      GRE
                    </option>

                    <option value="GMAT">
                      GMAT
                    </option>

                    <option value="Other">
                      Other
                    </option>
                  </select>
                </div>

              </div>

              {/* EXAM YEAR */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Examination Year
                </label>

                <input
                  type="number"
                  value={examYear}
                  onChange={(e) =>
                    setExamYear(e.target.value)
                  }
                  placeholder="Example: 2025"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* GATE */}
              {examType === "GATE" && (
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">

                  <h4 className="mb-5 text-lg font-semibold text-slate-800">
                    GATE Score Details
                  </h4>

                  <div className="grid gap-5 md:grid-cols-2">

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        GATE ME Score
                      </label>

                      <input
                        type="number"
                        step="any"
                        value={gateMeScore}
                        onChange={(e) =>
                          setGateMeScore(e.target.value)
                        }
                        placeholder="Enter ME score"
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        GATE XE Score
                      </label>

                      <input
                        type="number"
                        step="any"
                        value={gateXeScore}
                        onChange={(e) =>
                          setGateXeScore(e.target.value)
                        }
                        placeholder="Enter XE score"
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>

                  </div>
                </div>
              )}

              {/* OTHER EXAMS */}
              {examType &&
                examType !== "GATE" && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">

                    <h4 className="mb-5 text-lg font-semibold text-slate-800">
                      Examination Score
                    </h4>

                    <div className="grid gap-5 md:grid-cols-2">

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Score Type
                        </label>

                        <input
                          type="text"
                          value={scoreType}
                          onChange={(e) =>
                            setScoreType(e.target.value)
                          }
                          placeholder="Example: Percentile / Band / Score"
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Score
                        </label>

                        <input
                          type="number"
                          step="any"
                          value={score}
                          onChange={(e) =>
                            setScore(e.target.value)
                          }
                          placeholder="Enter score"
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                    </div>
                  </div>
                )}

              {/* RANK + PROOF */}
              <div className="grid gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Rank
                  </label>

                  <input
                    type="text"
                    value={rank}
                    onChange={(e) =>
                      setRank(e.target.value)
                    }
                    placeholder="Enter rank"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Proof / Result Google Drive Link
                  </label>

                  <input
                    type="url"
                    value={proofLink}
                    onChange={(e) =>
                      setProofLink(e.target.value)
                    }
                    placeholder="Paste Google Drive link"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

              </div>

              {/* REMARKS */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Remarks
                </label>

                <textarea
                  value={remarks}
                  onChange={(e) =>
                    setRemarks(e.target.value)
                  }
                  rows={3}
                  placeholder="Additional remarks (optional)"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* ERROR */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* SAVE */}
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Exam Record"
                      : "Save Exam Record"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={saving}
                    className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

            </form>
          </div>
        )}

        {/* SEARCH & FILTER */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print-hide-controls">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Search & Filter Examination Records
              </h3>
              <p className="text-sm text-slate-500">
                Search by student, registered number, batch, examination or rank.
              </p>
            </div>

            <div className="text-sm font-semibold text-slate-600">
              Showing {filteredRecords.length} of {records.length} records
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Search
              </label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search student / exam / rank"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Examination
              </label>
              <select
                value={filterExamType}
                onChange={(e) => setFilterExamType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">All Examinations</option>
                {examTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Examination Year
              </label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">All Years</option>
                {examYears.map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Batch
              </label>
              <select
                value={filterBatch}
                onChange={(e) => setFilterBatch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">All Batches</option>
                {batches.map((batch) => (
                  <option key={batch} value={batch ?? ""}>
                    {batch}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear Filters
            </button>

            <button
              type="button"
              onClick={exportToExcel}
              disabled={filteredRecords.length === 0}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export to Excel
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={filteredRecords.length === 0}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              🖨️ Print Preview
            </button>
          </div>
        </div>

        {/* PRINT-ONLY ANITS LETTERHEAD */}
        <div className="hidden print:block print-letterhead">
          <img
            src="/anits_letterhead.png"
            alt="ANITS Department of Mechanical Engineering Letterhead"
            className="w-full"
          />
        </div>

        {/* RECORDS */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print-records">

          {loading ? (
            <div className="p-10 text-center text-slate-500">
              Loading examination records...
            </div>
          ) : error && !showForm ? (
            <div className="p-10 text-center text-red-600">
              {error}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-10 text-center">

              <h3 className="text-lg font-semibold text-slate-700">
                No examination records found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                GATE, CAT, IELTS and other examination records will appear here.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1250px] text-left text-sm">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="px-5 py-4 font-semibold text-slate-700">
                      Student Name
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-700">
                      Registered Number
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-700">
                      Batch
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-700">
                      Examination
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-700">
                      Year
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-700">
                      Score
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-700">
                      Rank
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-700 print-hide-proof">
                      Proof
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-700 print-hide-actions">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredRecords.map((record) => (

                    <tr
                      key={record.id}
                      className="hover:bg-slate-50"
                    >

                      <td className="px-5 py-4 font-medium text-slate-800">
                        {record.student_name || "-"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {record.registered_number || "-"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {record.student_batch || "-"}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-700">
                        {record.exam_type || "-"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {record.exam_year || "-"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">

                        {record.exam_type === "GATE" ? (

                          <div className="space-y-1">

                            <div>
                              <span className="font-medium">
                                ME:
                              </span>{" "}
                              {record.gate_me_score ?? "-"}
                            </div>

                            <div>
                              <span className="font-medium">
                                XE:
                              </span>{" "}
                              {record.gate_xe_score ?? "-"}
                            </div>

                          </div>

                        ) : (

                          <div>
                            <span className="font-medium">
                              {record.score_type || "Score"}:
                            </span>{" "}
                            {record.score ?? "-"}
                          </div>

                        )}

                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {record.rank || "-"}
                      </td>

                      <td className="px-5 py-4 print-hide-proof">

                        {record.proof_link ? (

                          <a
                            href={record.proof_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:underline"
                          >
                            View Proof
                          </a>

                        ) : (

                          <span className="text-slate-400">
                            -
                          </span>

                        )}

                      </td>

                      <td className="px-5 py-4 print-hide-actions">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(record)}
                            className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(record.id)}
                            disabled={deletingId === record.id}
                            className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId === record.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </section>

      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 12mm;
        }

        @media print {
          html,
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          main {
            min-height: auto !important;
            background: white !important;
            padding: 0 !important;
          }

          .print-letterhead {
            display: block !important;
            margin-bottom: 8mm !important;
          }

          table {
            width: 100% !important;
            min-width: 0 !important;
            border-collapse: collapse !important;
            font-size: 10px !important;
          }

          thead {
            display: table-header-group;
          }

          tr {
            page-break-inside: avoid;
          }

          th,
          td {
            border: 1px solid #555 !important;
            padding: 6px !important;
          }

          th {
            background: #f0f0f0 !important;
            font-weight: 700 !important;
          }

          a {
            color: #000 !important;
            text-decoration: none !important;
          }

          a[href]:after {
            content: "" !important;
          }

          .print-hide-actions,
          .print-hide-controls,
          .print-hide-proof {
            display: none !important;
          }

          .print-records {
            border: 0 !important;
            box-shadow: none !important;
            background: white !important;
            overflow: visible !important;
          }

          section {
            margin: 0 !important;
            padding: 0 !important;
          }

          section > div.overflow-x-auto {
            margin: 0 !important;
            border-radius: 0 !important;
            overflow: visible !important;
          }
        }
      `}</style>

    </main>
  );
}

