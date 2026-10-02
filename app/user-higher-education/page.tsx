"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

type HigherEducationRecord = {
  id: string;

  student_name: string | null;
  registered_number: string | null;
  student_batch: string | null;

  program_level: string | null;
  program_name: string | null;
  specialization: string | null;

  institution_name: string | null;
  institution_location: string | null;

  admission_year: number | null;

  proof_link: string | null;
  remarks: string | null;

  created_at: string | null;
};

type SortField =
  | "student_name"
  | "registered_number"
  | "student_batch"
  | "program_level"
  | "program_name"
  | "admission_year";

const PROGRAM_LEVEL_OPTIONS = [
  "M.Tech",
  "M.S",
  "MBA",
  "M.E",
  "Ph.D",
  "MCA",
  "M.Sc",
  "Other",
];

export default function UserHigherEducationPage() {
  const [records, setRecords] = useState<HigherEducationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [programLevelFilter, setProgramLevelFilter] =
    useState("All");

  const [admissionYearFilter, setAdmissionYearFilter] =
    useState("All");

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
      .from("higher_education")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        "Error fetching higher education records:",
        error
      );

      alert("Unable to load higher education records.");
      setRecords([]);
    } else {
      setRecords(
        (data || []) as HigherEducationRecord[]
      );
    }

    setLoading(false);
  }

  /* =========================================================
     FILTER OPTIONS
  ========================================================= */

  const admissionYears = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map((item) => item.admission_year)
          .filter(
            (year): year is number =>
              year !== null
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

  /* =========================================================
     FILTER + SORT
  ========================================================= */

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
        (record.program_level || "")
          .toLowerCase()
          .includes(searchText) ||
        (record.program_name || "")
          .toLowerCase()
          .includes(searchText) ||
        (record.specialization || "")
          .toLowerCase()
          .includes(searchText) ||
        (record.institution_name || "")
          .toLowerCase()
          .includes(searchText) ||
        (record.institution_location || "")
          .toLowerCase()
          .includes(searchText);

      const matchesProgramLevel =
        programLevelFilter === "All" ||
        record.program_level === programLevelFilter;

      const matchesAdmissionYear =
        admissionYearFilter === "All" ||
        String(record.admission_year || "") ===
          admissionYearFilter;

      const matchesBatch =
        batchFilter === "All" ||
        record.student_batch === batchFilter;

      return (
        matchesSearch &&
        matchesProgramLevel &&
        matchesAdmissionYear &&
        matchesBatch
      );
    });

    return [...filtered].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (
        aValue === null ||
        aValue === undefined
      ) {
        return 1;
      }

      if (
        bValue === null ||
        bValue === undefined
      ) {
        return -1;
      }

      let comparison = 0;

      if (
        typeof aValue === "number" &&
        typeof bValue === "number"
      ) {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue)
          .toLowerCase()
          .localeCompare(
            String(bValue).toLowerCase()
          );
      }

      return sortDirection === "asc"
        ? comparison
        : -comparison;
    });
  }, [
    records,
    search,
    programLevelFilter,
    admissionYearFilter,
    batchFilter,
    sortField,
    sortDirection,
  ]);

  /* =========================================================
     EXCEL EXPORT
  ========================================================= */

  function handleExportExcel() {
    if (filteredRecords.length === 0) {
      alert("No records available to export.");
      return;
    }

    const exportData = filteredRecords.map(
      (record, index) => ({
        "S.No.": index + 1,

        "Student Name":
          record.student_name || "",

        "Registered Number":
          record.registered_number || "",

        Batch:
          record.student_batch || "",

        "Program Level":
          record.program_level || "",

        "Program Name":
          record.program_name || "",

        Specialization:
          record.specialization || "",

        "Institution Name":
          record.institution_name || "",

        "Institution Location":
          record.institution_location || "",

        "Admission Year":
          record.admission_year ?? "",

        Remarks:
          record.remarks || "",

        "Proof Link":
          record.proof_link || "",
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
      { wch: 28 },
      { wch: 25 },
      { wch: 35 },
      { wch: 25 },
      { wch: 16 },
      { wch: 35 },
      { wch: 45 },
    ];

    const workbook =
      XLSX.utils.book_new();

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

  /* =========================================================
     PRINT
  ========================================================= */

  function handlePrint() {
    if (filteredRecords.length === 0) {
      alert("No records available to print.");
      return;
    }

    window.print();
  }

  /* =========================================================
     RESET FILTERS
  ========================================================= */

  function handleResetFilters() {
    setSearch("");
    setProgramLevelFilter("All");
    setAdmissionYearFilter("All");
    setBatchFilter("All");

    setSortField("student_name");
    setSortDirection("asc");
  }

  /* =========================================================
     DASHBOARD
  ========================================================= */

  function goToDashboard() {
    window.location.href = "/user-dashboard";
  }

  /* =========================================================
     PRINT SUMMARY
  ========================================================= */

  const printFilterSummary = useMemo(() => {
    const parts: string[] = [];

    if (search.trim()) {
      parts.push(`Search: ${search.trim()}`);
    }

    if (programLevelFilter !== "All") {
      parts.push(
        `Program Level: ${programLevelFilter}`
      );
    }

    if (admissionYearFilter !== "All") {
      parts.push(
        `Admission Year: ${admissionYearFilter}`
      );
    }

    if (batchFilter !== "All") {
      parts.push(`Batch: ${batchFilter}`);
    }

    return parts.length > 0
      ? parts.join("  |  ")
      : "All Records";
  }, [
    search,
    programLevelFilter,
    admissionYearFilter,
    batchFilter,
  ]);

  const printSortLabel = useMemo(() => {
    const labels: Record<SortField, string> = {
      student_name: "Student Name",
      registered_number: "Registered Number",
      student_batch: "Batch",
      program_level: "Program Level",
      program_name: "Program",
      admission_year: "Admission Year",
    };

    return `${labels[sortField]} ${
      sortDirection === "asc"
        ? "Ascending"
        : "Descending"
    }`;
  }, [sortField, sortDirection]);

  return (
    <>
      {/* =====================================================
          SCREEN VIEW
      ===================================================== */}

      <div className="min-h-screen bg-gray-100 p-6 screen-page">

        <div className="mx-auto max-w-7xl">

          {/* HEADER */}
          <div className="mb-6 rounded-xl bg-white p-6 shadow screen-only">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Higher Education Students
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  View-only access
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">

                <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                  Total Records:{" "}
                  {filteredRecords.length}
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

          {/* =================================================
              FILTERS
          ================================================= */}

          <div className="mb-6 rounded-xl bg-white p-6 shadow screen-only">

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">

              {/* SEARCH */}
              <div className="lg:col-span-2">

                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Search
                </label>

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Student / Reg. No. / Program / Institution..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />

              </div>

              {/* PROGRAM LEVEL */}
              <div>

                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Program Level
                </label>

                <select
                  value={programLevelFilter}
                  onChange={(e) =>
                    setProgramLevelFilter(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >

                  <option value="All">
                    All
                  </option>

                  {PROGRAM_LEVEL_OPTIONS.map(
                    (level) => (
                      <option
                        key={level}
                        value={level}
                      >
                        {level}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* ADMISSION YEAR */}
              <div>

                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Admission Year
                </label>

                <select
                  value={admissionYearFilter}
                  onChange={(e) =>
                    setAdmissionYearFilter(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >

                  <option value="All">
                    All
                  </option>

                  {admissionYears.map((year) => (
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
                    All
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

                  <option value="program_level">
                    Program Level
                  </option>

                  <option value="program_name">
                    Program
                  </option>

                  <option value="admission_year">
                    Admission Year
                  </option>

                </select>

              </div>

              {/* SORT ORDER */}
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
                    ↑ Ascending
                  </option>

                  <option value="desc">
                    ↓ Descending
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

          {/* =================================================
              SCREEN TABLE
          ================================================= */}

          <div className="overflow-hidden rounded-xl bg-white shadow screen-only">

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1350px] border-collapse text-sm">

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
                      Program Level
                    </th>

                    <th className="border px-4 py-3 text-left">
                      Program
                    </th>

                    <th className="border px-4 py-3 text-left">
                      Specialization
                    </th>

                    <th className="border px-4 py-3 text-left">
                      Institution
                    </th>

                    <th className="border px-4 py-3 text-left">
                      Admission Year
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
                        colSpan={10}
                        className="px-4 py-10 text-center text-gray-500"
                      >
                        Loading records...
                      </td>

                    </tr>

                  ) : filteredRecords.length === 0 ? (

                    <tr>

                      <td
                        colSpan={10}
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
                            {record.program_level || "-"}
                          </td>

                          <td className="border px-4 py-3">
                            {record.program_name || "-"}
                          </td>

                          <td className="border px-4 py-3">
                            {record.specialization || "-"}
                          </td>

                          <td className="border px-4 py-3">

                            <div>
                              {record.institution_name || "-"}
                            </div>

                            {record.institution_location && (
                              <div className="mt-1 text-xs text-gray-500">
                                {
                                  record.institution_location
                                }
                              </div>
                            )}

                          </td>

                          <td className="border px-4 py-3">
                            {record.admission_year || "-"}
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
          PRINT / PDF REPORT
      ===================================================== */}

      <div className="print-report">

        {/* OFFICIAL ANITS LETTERHEAD */}

        <div className="print-letterhead">
          <img
            src="/anits_letterhead.png"
            alt="ANITS Department of Mechanical Engineering Letterhead"
          />
        </div>

        {/* REPORT HEADER */}

        <div className="print-report-heading">

          <h1>
            HIGHER EDUCATION STUDENTS
          </h1>

          <h2>
            Student Higher Education Database Report
          </h2>

        </div>

        {/* REPORT SUMMARY */}

        <div className="print-summary">

          <div className="summary-box">

            <span className="summary-label">
              Total Records
            </span>

            <strong>
              {filteredRecords.length}
            </strong>

          </div>

          <div className="summary-box">

            <span className="summary-label">
              Filter
            </span>

            <strong>
              {printFilterSummary}
            </strong>

          </div>

          <div className="summary-box">

            <span className="summary-label">
              Sort Order
            </span>

            <strong>
              {printSortLabel}
            </strong>

          </div>

        </div>

        {/* PRINT TABLE */}

        <table className="print-table">

          <thead>

            <tr>

              <th>
                S.No.
              </th>

              <th>
                Student Name
              </th>

              <th>
                Registered No.
              </th>

              <th>
                Batch
              </th>

              <th>
                Program Level
              </th>

              <th>
                Program
              </th>

              <th>
                Specialization
              </th>

              <th>
                Institution
              </th>

              <th>
                Admission Year
              </th>

            </tr>

          </thead>

          <tbody>

            {filteredRecords.map(
              (record, index) => (

                <tr key={record.id}>

                  <td className="text-center">
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
                    {record.program_level || "-"}
                  </td>

                  <td>
                    {record.program_name || "-"}
                  </td>

                  <td>
                    {record.specialization || "-"}
                  </td>

                  <td className="institution-cell">

                    <div className="institution-name">
                      {record.institution_name || "-"}
                    </div>

                    {record.institution_location && (
                      <div className="institution-location">
                        {record.institution_location}
                      </div>
                    )}

                  </td>

                  <td className="text-center">
                    {record.admission_year || "-"}
                  </td>

                </tr>

              )
            )}

          </tbody>

        </table>

        {/* PRINT FOOTER */}

        <div className="print-footer">

          <div>
            ANITS Student Higher Education Database
          </div>

          <div>
            Department of Mechanical Engineering
          </div>

        </div>

      </div>

      {/* =====================================================
          PRINT CSS
      ===================================================== */}

      <style jsx global>{`

        .print-report {
          display: none;
        }

        @media print {

          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          html,
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .screen-only,
          .screen-page {
            display: none !important;
          }

          .print-report {
            display: block !important;
            width: 100%;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: Arial, Helvetica, sans-serif;
          }

          /* -------------------------------------------------
             LETTERHEAD
          ------------------------------------------------- */

          .print-letterhead {
            display: block !important;
            width: 100%;
            margin-bottom: 6mm;
          }

          .print-letterhead img {
            display: block;
            width: 100%;
            height: auto;
            max-height: 32mm;
            object-fit: contain;
          }

          /* -------------------------------------------------
             REPORT TITLE
          ------------------------------------------------- */

          .print-report-heading {
            text-align: center;
            margin-bottom: 5mm;
          }

          .print-report-heading h1 {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }

          .print-report-heading h2 {
            margin: 1.5mm 0 0;
            font-size: 11px;
            font-weight: 400;
          }

          /* -------------------------------------------------
             SUMMARY
          ------------------------------------------------- */

          .print-summary {
            display: grid;
            grid-template-columns: 28mm 1fr 55mm;
            gap: 3mm;
            margin-bottom: 5mm;
            font-size: 8.5px;
          }

          .summary-box {
            border: 1px solid #888;
            padding: 2.5mm 3mm;
            min-height: 10mm;
          }

          .summary-label {
            display: block;
            font-size: 7.5px;
            font-weight: 700;
            text-transform: uppercase;
            color: #555;
            margin-bottom: 1mm;
          }

          .summary-box strong {
            display: block;
            font-size: 8.5px;
            font-weight: 600;
          }

          /* -------------------------------------------------
             PRINT TABLE
          ------------------------------------------------- */

          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
            font-size: 8.5px !important;
            page-break-inside: auto;
          }

          .print-table thead {
            display: table-header-group !important;
          }

          .print-table tbody {
            display: table-row-group;
          }

          .print-table tr {
            page-break-inside: avoid !important;
            page-break-after: auto;
          }

          .print-table th,
          .print-table td {
            border: 1px solid #555 !important;
            padding: 2.2mm 1.8mm !important;
            vertical-align: top !important;
            line-height: 1.25 !important;
            word-wrap: break-word !important;
            overflow-wrap: anywhere !important;
          }

          .print-table th {
            background: #e9e9e9 !important;
            color: #000000 !important;
            font-weight: 700 !important;
            text-align: center !important;
            vertical-align: middle !important;
          }

          .print-table td {
            background: #ffffff !important;
          }

          /* -------------------------------------------------
             COLUMN WIDTHS
          ------------------------------------------------- */

          .print-table th:nth-child(1),
          .print-table td:nth-child(1) {
            width: 8mm;
          }

          .print-table th:nth-child(2),
          .print-table td:nth-child(2) {
            width: 34mm;
          }

          .print-table th:nth-child(3),
          .print-table td:nth-child(3) {
            width: 28mm;
          }

          .print-table th:nth-child(4),
          .print-table td:nth-child(4) {
            width: 18mm;
          }

          .print-table th:nth-child(5),
          .print-table td:nth-child(5) {
            width: 24mm;
          }

          .print-table th:nth-child(6),
          .print-table td:nth-child(6) {
            width: 31mm;
          }

          .print-table th:nth-child(7),
          .print-table td:nth-child(7) {
            width: 31mm;
          }

          .print-table th:nth-child(8),
          .print-table td:nth-child(8) {
            width: 55mm;
          }

          .print-table th:nth-child(9),
          .print-table td:nth-child(9) {
            width: 24mm;
          }

          .student-name-cell {
            font-weight: 600 !important;
          }

          .institution-cell {
            vertical-align: top !important;
          }

          .institution-name {
            font-weight: 600;
          }

          .institution-location {
            margin-top: 1mm;
            font-size: 7.5px;
            color: #444;
          }

          .text-center {
            text-align: center !important;
          }

          /* -------------------------------------------------
             FOOTER
          ------------------------------------------------- */

          .print-footer {
            display: flex;
            justify-content: space-between;
            margin-top: 5mm;
            padding-top: 2.5mm;
            border-top: 1px solid #777;
            font-size: 7.5px;
            color: #444;
          }

          button,
          input,
          select,
          textarea,
          a {
            box-shadow: none !important;
          }

          a {
            color: #000000 !important;
            text-decoration: none !important;
          }

          a[href]:after {
            content: "" !important;
          }
        }

      `}</style>
    </>
  );
}