"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

type ExamRecord = {
  id: string;
  student_name: string | null;
  registered_number: string | null;
  student_batch: string | null;

  exam_type: string | null;
  exam_year: number | null;

  score: number | null;
  score_type: string | null;
  rank: string | null;

  gate_me_score: number | null;
  gate_xe_score: number | null;

  proof_link: string | null;
  remarks: string | null;

  created_at: string | null;
};

type SortField =
  | "student_name"
  | "registered_number"
  | "student_batch"
  | "exam_type"
  | "exam_year"
  | "rank";

export default function UserEntranceExamsPage() {
  const [records, setRecords] = useState<ExamRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [examTypeFilter, setExamTypeFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [batchFilter, setBatchFilter] = useState("All");

  const [sortField, setSortField] =
    useState<SortField>("student_name");

  const [sortDirection, setSortDirection] =
    useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetchRecords();
  }, []);

  async function fetchRecords() {
    setLoading(true);

    const { data, error } = await supabase
      .from("exam_records")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        "Error fetching entrance exam records:",
        error
      );

      alert("Unable to load entrance exam records.");
      setRecords([]);
    } else {
      setRecords((data || []) as ExamRecord[]);
    }

    setLoading(false);
  }

  const examTypes = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map((item) => item.exam_type)
          .filter(Boolean)
      )
    ).sort();
  }, [records]);

  const examYears = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map((item) => item.exam_year)
          .filter(
            (year): year is number => year !== null
          )
      )
    ).sort((a, b) => b - a);
  }, [records]);

  const batches = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map((item) => item.student_batch)
          .filter(Boolean)
      )
    ).sort();
  }, [records]);

  const filteredRecords = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    const filtered = records.filter((record) => {
      const matchesSearch =
        !searchText ||
        (record.student_name || "")
          .toLowerCase()
          .includes(searchText) ||
        (record.registered_number || "")
          .toLowerCase()
          .includes(searchText) ||
        (record.student_batch || "")
          .toLowerCase()
          .includes(searchText) ||
        (record.exam_type || "")
          .toLowerCase()
          .includes(searchText) ||
        String(record.exam_year || "")
          .includes(searchText) ||
        (record.rank || "")
          .toLowerCase()
          .includes(searchText);

      const matchesExamType =
        examTypeFilter === "All" ||
        record.exam_type === examTypeFilter;

      const matchesYear =
        yearFilter === "All" ||
        String(record.exam_year || "") === yearFilter;

      const matchesBatch =
        batchFilter === "All" ||
        record.student_batch === batchFilter;

      return (
        matchesSearch &&
        matchesExamType &&
        matchesYear &&
        matchesBatch
      );
    });

    filtered.sort((a, b) => {
      let valueA: string | number = "";
      let valueB: string | number = "";

      switch (sortField) {
        case "student_name":
          valueA = (a.student_name || "").toLowerCase();
          valueB = (b.student_name || "").toLowerCase();
          break;

        case "registered_number":
          valueA = (
            a.registered_number || ""
          ).toLowerCase();

          valueB = (
            b.registered_number || ""
          ).toLowerCase();
          break;

        case "student_batch":
          valueA = (
            a.student_batch || ""
          ).toLowerCase();

          valueB = (
            b.student_batch || ""
          ).toLowerCase();
          break;

        case "exam_type":
          valueA = (
            a.exam_type || ""
          ).toLowerCase();

          valueB = (
            b.exam_type || ""
          ).toLowerCase();
          break;

        case "exam_year":
          valueA = a.exam_year ?? 0;
          valueB = b.exam_year ?? 0;
          break;

        case "rank":
          valueA = parseFloat(
            String(a.rank || "").replace(/,/g, "")
          );

          valueB = parseFloat(
            String(b.rank || "").replace(/,/g, "")
          );

          if (isNaN(valueA)) valueA = Infinity;
          if (isNaN(valueB)) valueB = Infinity;

          break;
      }

      if (valueA < valueB) {
        return sortDirection === "asc" ? -1 : 1;
      }

      if (valueA > valueB) {
        return sortDirection === "asc" ? 1 : -1;
      }

      return 0;
    });

    return filtered;
  }, [
    records,
    search,
    examTypeFilter,
    yearFilter,
    batchFilter,
    sortField,
    sortDirection,
  ]);

  function handleExportExcel() {
    if (filteredRecords.length === 0) {
      alert("No records available to export.");
      return;
    }

    const exportData = filteredRecords.map(
      (record, index) => ({
        "S.No.": index + 1,
        "Student Name": record.student_name || "",
        "Registered Number":
          record.registered_number || "",
        Batch: record.student_batch || "",
        "Exam Type": record.exam_type || "",
        "Exam Qualified Year": record.exam_year || "",
        "Score Type": record.score_type || "",
        Score: record.score ?? "",
        "GATE ME Score": record.gate_me_score ?? "",
        "GATE XE Score": record.gate_xe_score ?? "",
        Rank: record.rank || "",
        Remarks: record.remarks || "",
        "Proof Link": record.proof_link || "",
      })
    );

    const worksheet =
      XLSX.utils.json_to_sheet(exportData);

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 30 },
      { wch: 22 },
      { wch: 15 },
      { wch: 18 },
      { wch: 22 },
      { wch: 15 },
      { wch: 12 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 30 },
      { wch: 45 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Entrance Exams"
    );

    XLSX.writeFile(
      workbook,
      "ANITS_Entrance_Exam_Records.xlsx"
    );
  }

  function handlePrint() {
    window.print();
  }

  function handleResetFilters() {
    setSearch("");
    setExamTypeFilter("All");
    setYearFilter("All");
    setBatchFilter("All");

    setSortField("student_name");
    setSortDirection("asc");
  }

  function goToDashboard() {
    window.location.href = "/user-dashboard";
  }

  return (
    <>
      {/* =====================================================
          SCREEN VERSION
      ====================================================== */}

      <div className="print:hidden min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-7xl">

          {/* HEADER */}
          <div className="mb-6 rounded-xl bg-white p-6 shadow">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Entrance Exams / GATE Records
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  View-only access
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">

                <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                  Total Records: {filteredRecords.length}
                </div>

                <button
                  onClick={goToDashboard}
                  className="rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-900"
                >
                  🏠 Go to Dashboard
                </button>

              </div>

            </div>

          </div>

          {/* SEARCH + FILTERS */}
          <div className="mb-6 rounded-xl bg-white p-6 shadow">

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

              {/* SEARCH */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Search
                </label>

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Student / Reg. No. / Exam / Rank..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* EXAM TYPE */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Exam Type
                </label>

                <select
                  value={examTypeFilter}
                  onChange={(e) =>
                    setExamTypeFilter(e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="All">
                    All Exam Types
                  </option>

                  {examTypes.map((type) => (
                    <option key={type} value={type ?? ""}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* EXAM QUALIFIED YEAR */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Exam Qualified Year
                </label>

                <select
                  value={yearFilter}
                  onChange={(e) =>
                    setYearFilter(e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="All">
                    All Qualified Years
                  </option>

                  {examYears.map((year) => (
                    <option
                      key={year}
                      value={String(year)}
                    >
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* BATCH */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Batch
                </label>

                <select
                  value={batchFilter}
                  onChange={(e) =>
                    setBatchFilter(e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="All">
                    All Batches
                  </option>

                  {batches.map((batch) => (
                    <option
                      key={batch}
                      value={batch || ""}
                    >
                      {batch}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* SORTING */}
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">

              {/* SORT BY */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Sort By
                </label>

                <select
                  value={sortField}
                  onChange={(e) =>
                    setSortField(
                      e.target.value as SortField
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="student_name">
                    Student Name
                  </option>

                  <option value="registered_number">
                    Registered Number
                  </option>

                  <option value="student_batch">
                    Batch
                  </option>

                  <option value="exam_type">
                    Exam Type
                  </option>

                  <option value="exam_year">
                    Exam Qualified Year
                  </option>

                  <option value="rank">
                    Rank
                  </option>
                </select>
              </div>

              {/* ORDER */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Order
                </label>

                <select
                  value={sortDirection}
                  onChange={(e) =>
                    setSortDirection(
                      e.target.value as
                        | "asc"
                        | "desc"
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="asc">
                    A → Z / Low → High
                  </option>

                  <option value="desc">
                    Z → A / High → Low
                  </option>
                </select>
              </div>

            </div>

            {/* BUTTONS */}
            <div className="mt-5 flex flex-wrap gap-3">

              <button
                onClick={handleResetFilters}
                className="rounded-lg bg-gray-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700"
              >
                Reset Filters
              </button>

              <button
                onClick={handleExportExcel}
                className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
              >
                📊 Export Excel
              </button>

              <button
                onClick={handlePrint}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                🖨️ Print / Save PDF
              </button>

            </div>

          </div>

          {/* TABLE */}
          <div className="overflow-hidden rounded-xl bg-white shadow">

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1200px] border-collapse text-sm">

                <thead className="bg-gray-800 text-white">

                  <tr>

                    <th className="border px-4 py-3 text-left">
                      S.No.
                    </th>

                    <th className="border px-4 py-3 text-left">
                      Student Name
                    </th>

                    <th className="border px-4 py-3 text-left">
                      Registered No.
                    </th>

                    <th className="border px-4 py-3 text-left">
                      Batch
                    </th>

                    <th className="border px-4 py-3 text-left">
                      Exam
                    </th>

                    <th className="border px-4 py-3 text-left">
                      Qualified Year
                    </th>

                    <th className="border px-4 py-3 text-left">
                      Score
                    </th>

                    <th className="border px-4 py-3 text-left">
                      GATE ME
                    </th>

                    <th className="border px-4 py-3 text-left">
                      GATE XE
                    </th>

                    <th className="border px-4 py-3 text-left">
                      Rank
                    </th>

                    <th className="border px-4 py-3 text-left">
                      Proof
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {loading ? (

                    <tr>
                      <td
                        colSpan={11}
                        className="px-4 py-10 text-center text-gray-500"
                      >
                        Loading records...
                      </td>
                    </tr>

                  ) : filteredRecords.length === 0 ? (

                    <tr>
                      <td
                        colSpan={11}
                        className="px-4 py-10 text-center text-gray-500"
                      >
                        No records found.
                      </td>
                    </tr>

                  ) : (

                    filteredRecords.map(
                      (record, index) => (

                        <tr
                          key={record.id}
                          className="hover:bg-gray-50"
                        >

                          <td className="border px-4 py-3">
                            {index + 1}
                          </td>

                          <td className="border px-4 py-3 font-medium">
                            {record.student_name || "-"}
                          </td>

                          <td className="border px-4 py-3">
                            {record.registered_number || "-"}
                          </td>

                          <td className="border px-4 py-3">
                            {record.student_batch || "-"}
                          </td>

                          <td className="border px-4 py-3">
                            {record.exam_type || "-"}
                          </td>

                          <td className="border px-4 py-3">
                            {record.exam_year || "-"}
                          </td>

                          <td className="border px-4 py-3">
                            {record.score ?? "-"}
                            {record.score_type
                              ? ` (${record.score_type})`
                              : ""}
                          </td>

                          <td className="border px-4 py-3">
                            {record.gate_me_score ?? "-"}
                          </td>

                          <td className="border px-4 py-3">
                            {record.gate_xe_score ?? "-"}
                          </td>

                          <td className="border px-4 py-3">
                            {record.rank || "-"}
                          </td>

                          <td className="border px-4 py-3">

                            {record.proof_link ? (

                              <a
                                href={record.proof_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-blue-600 hover:underline"
                              >
                                View Proof
                              </a>

                            ) : (

                              "-"

                            )}

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </div>
      </div>


      {/* =====================================================
          PRINT-ONLY REPORT
      ====================================================== */}

      <div className="hidden print:block print-report">

        {/* OFFICIAL ANITS LETTERHEAD */}
        <div className="print-letterhead">
          <img
            src="/anits_letterhead.png"
            alt="ANITS Department of Mechanical Engineering Letterhead"
            className="w-full"
          />
        </div>

        {/* REPORT TITLE */}
        <div className="print-report-title">

          <h1>
            ENTRANCE EXAMINATION / GATE RECORDS
          </h1>

          <div className="print-line"></div>

        </div>

        {/* REPORT INFORMATION */}
        <div className="print-info">

          <div>
            <strong>Batch:</strong>{" "}
            {batchFilter === "All"
              ? "All Batches"
              : batchFilter}
          </div>

          <div>
            <strong>Exam Qualified Year:</strong>{" "}
            {yearFilter === "All"
              ? "All Years"
              : yearFilter}
          </div>

          <div>
            <strong>Exam Type:</strong>{" "}
            {examTypeFilter === "All"
              ? "All Exam Types"
              : examTypeFilter}
          </div>

          <div>
            <strong>Total Records:</strong>{" "}
            {filteredRecords.length}
          </div>

        </div>

        {/* PRINT TABLE */}
        <table className="print-table">

          <thead>

            <tr>

              <th>S.No.</th>

              <th>Student Name</th>

              <th>Registered No.</th>

              <th>Batch</th>

              <th>Exam</th>

              <th>Qualified Year</th>

              <th>Score</th>

              <th>GATE ME</th>

              <th>GATE XE</th>

              <th>Rank</th>

            </tr>

          </thead>

          <tbody>

            {filteredRecords.map(
              (record, index) => (

                <tr key={record.id}>

                  <td>
                    {index + 1}
                  </td>

                  <td className="student-name-cell">
                    {record.student_name || "-"}
                  </td>

                  <td>
                    {record.registered_number || "-"}
                  </td>

                  <td>
                    {record.student_batch || "-"}
                  </td>

                  <td>
                    {record.exam_type || "-"}
                  </td>

                  <td>
                    {record.exam_year || "-"}
                  </td>

                  <td>
                    {record.score ?? "-"}
                    {record.score_type
                      ? ` (${record.score_type})`
                      : ""}
                  </td>

                  <td>
                    {record.gate_me_score ?? "-"}
                  </td>

                  <td>
                    {record.gate_xe_score ?? "-"}
                  </td>

                  <td>
                    {record.rank || "-"}
                  </td>

                </tr>

              )
            )}

          </tbody>

        </table>

        {/* REPORT FOOTER */}
        <div className="print-footer">

          <div>
            Department of Mechanical Engineering
          </div>

          <div>
            ANITS – Student Higher Education Database
          </div>

        </div>

      </div>


      {/* =====================================================
          PRINT STYLES
      ====================================================== */}

      <style jsx global>{`

        @page {
          size: A4 landscape;
          margin: 10mm;
        }

        @media print {

          html,
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-report {
            display: block !important;
            width: 100% !important;
            background: white !important;
          }

          .print-letterhead {
            display: block !important;
            width: 100% !important;
            margin-bottom: 5mm !important;
          }

          .print-letterhead img {
            display: block !important;
            width: 100% !important;
            height: auto !important;
          }

          .print-report-title {
            text-align: center !important;
            margin-top: 2mm !important;
            margin-bottom: 4mm !important;
          }

          .print-report-title h1 {
            margin: 0 !important;
            padding: 0 !important;
            font-size: 16px !important;
            font-weight: 700 !important;
            color: #111 !important;
          }

          .print-line {
            width: 100% !important;
            border-bottom: 1px solid #333 !important;
            margin-top: 3mm !important;
          }

          .print-info {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 4mm !important;
            margin-bottom: 5mm !important;
            padding: 3mm !important;
            border: 1px solid #777 !important;
            font-size: 9px !important;
          }

          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
            font-size: 8.5px !important;
          }

          .print-table thead {
            display: table-header-group !important;
          }

          .print-table tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .print-table th,
          .print-table td {
            border: 1px solid #444 !important;
            padding: 4px 3px !important;
            text-align: center !important;
            vertical-align: middle !important;
            word-wrap: break-word !important;
          }

          .print-table th {
            background: #e9e9e9 !important;
            color: #111 !important;
            font-weight: 700 !important;
          }

          .print-table th:nth-child(1) {
            width: 5% !important;
          }

          .print-table th:nth-child(2) {
            width: 20% !important;
          }

          .print-table th:nth-child(3) {
            width: 13% !important;
          }

          .print-table th:nth-child(4) {
            width: 10% !important;
          }

          .print-table th:nth-child(5) {
            width: 10% !important;
          }

          .print-table th:nth-child(6) {
            width: 10% !important;
          }

          .print-table th:nth-child(7) {
            width: 9% !important;
          }

          .print-table th:nth-child(8) {
            width: 8% !important;
          }

          .print-table th:nth-child(9) {
            width: 8% !important;
          }

          .print-table th:nth-child(10) {
            width: 7% !important;
          }

          .student-name-cell {
            text-align: left !important;
            font-weight: 500 !important;
          }

          .print-footer {
            display: flex !important;
            justify-content: space-between !important;
            margin-top: 6mm !important;
            padding-top: 2mm !important;
            border-top: 1px solid #888 !important;
            font-size: 8px !important;
            color: #444 !important;
          }

          a {
            color: #000 !important;
            text-decoration: none !important;
          }

          a[href]::after {
            content: "" !important;
          }

        }

      `}</style>
    </>
  );
}

