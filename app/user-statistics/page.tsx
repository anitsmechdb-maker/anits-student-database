"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

/* =========================================================
   TYPES
========================================================= */

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
  completion_year: number | null;

  proof_link: string | null;
  remarks: string | null;

  created_at: string | null;
};

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

  created_at: string | null;
};

/* =========================================================
   HELPER
========================================================= */

function studentKey(
  registeredNumber: string | null,
  studentName: string | null
) {
  const reg = (registeredNumber || "").trim().toLowerCase();

  if (reg) {
    return `reg:${reg}`;
  }

  return `name:${(studentName || "").trim().toLowerCase()}`;
}

/* =========================================================
   PAGE
========================================================= */

export default function UserStatisticsPage() {
  const [higherEducation, setHigherEducation] = useState<
    HigherEducationRecord[]
  >([]);

  const [examRecords, setExamRecords] = useState<ExamRecord[]>([]);

  const [loading, setLoading] = useState(true);

  /* FILTERS */

  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("All");
  const [admissionYearFilter, setAdmissionYearFilter] =
    useState("All");
  const [gateYearFilter, setGateYearFilter] =
    useState("All");

  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {
    loadStatistics();
  }, []);

  async function loadStatistics() {
    setLoading(true);

    const [
      higherEducationResult,
      examResult,
    ] = await Promise.all([
      supabase
        .from("higher_education")
        .select("*")
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("exam_records")
        .select("*")
        .order("exam_year", {
          ascending: false,
        }),
    ]);

    if (higherEducationResult.error) {
      console.error(
        "Higher Education error:",
        higherEducationResult.error
      );
    }

    if (examResult.error) {
      console.error(
        "Exam records error:",
        examResult.error
      );
    }

    setHigherEducation(
      (higherEducationResult.data ||
        []) as HigherEducationRecord[]
    );

    setExamRecords(
      (examResult.data ||
        []) as ExamRecord[]
    );

    setLoading(false);
  }

  /* =========================================================
     FILTER OPTIONS
  ========================================================= */

  const batches = useMemo(() => {
    return Array.from(
      new Set(
        [
          ...higherEducation.map(
            (r) => r.student_batch
          ),
          ...examRecords.map(
            (r) => r.student_batch
          ),
        ].filter(Boolean)
      )
    ).sort();
  }, [higherEducation, examRecords]);

  const admissionYears = useMemo(() => {
    return Array.from(
      new Set(
        higherEducation
          .map((r) => r.admission_year)
          .filter(
            (year): year is number =>
              year !== null &&
              year !== undefined
          )
      )
    ).sort((a, b) => b - a);
  }, [higherEducation]);

  const gateYears = useMemo(() => {
    return Array.from(
      new Set(
        examRecords
          .map((r) => r.exam_year)
          .filter(
            (year): year is number =>
              year !== null &&
              year !== undefined
          )
      )
    ).sort((a, b) => b - a);
  }, [examRecords]);

  /* =========================================================
     FILTERED HIGHER EDUCATION
  ========================================================= */

  const filteredHigherEducation = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    return higherEducation.filter((record) => {
      const matchesSearch =
        !searchText ||
        [
          record.student_name,
          record.registered_number,
          record.student_batch,
          record.program_level,
          record.program_name,
          record.specialization,
          record.institution_name,
          record.institution_location,
          record.admission_year?.toString(),
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(searchText)
          );

      const matchesBatch =
        batchFilter === "All" ||
        record.student_batch === batchFilter;

      const matchesAdmissionYear =
        admissionYearFilter === "All" ||
        String(record.admission_year) ===
          admissionYearFilter;

      return (
        matchesSearch &&
        matchesBatch &&
        matchesAdmissionYear
      );
    });
  }, [
    higherEducation,
    search,
    batchFilter,
    admissionYearFilter,
  ]);

  /* =========================================================
     FILTERED EXAM RECORDS
  ========================================================= */

  const filteredExamRecords = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    return examRecords.filter((record) => {
      const matchesSearch =
        !searchText ||
        [
          record.student_name,
          record.registered_number,
          record.student_batch,
          record.exam_type,
          record.exam_year?.toString(),
          record.rank,
          record.score_type,
          record.gate_me_score?.toString(),
          record.gate_xe_score?.toString(),
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(searchText)
          );

      const matchesBatch =
        batchFilter === "All" ||
        record.student_batch === batchFilter;

      const matchesGateYear =
        gateYearFilter === "All" ||
        String(record.exam_year) ===
          gateYearFilter;

      return (
        matchesSearch &&
        matchesBatch &&
        matchesGateYear
      );
    });
  }, [
    examRecords,
    search,
    batchFilter,
    gateYearFilter,
  ]);

  /* =========================================================
     UNIQUE STUDENTS
  ========================================================= */

  const uniqueHigherEducationStudents =
    useMemo(() => {
      const map = new Map<
        string,
        HigherEducationRecord
      >();

      filteredHigherEducation.forEach((record) => {
        const key = studentKey(
          record.registered_number,
          record.student_name
        );

        if (!map.has(key)) {
          map.set(key, record);
        }
      });

      return Array.from(map.values());
    }, [filteredHigherEducation]);

  const uniqueGateStudents = useMemo(() => {
    const map = new Map<
      string,
      ExamRecord
    >();

    filteredExamRecords.forEach((record) => {
      const key = studentKey(
        record.registered_number,
        record.student_name
      );

      if (!map.has(key)) {
        map.set(key, record);
      }
    });

    return Array.from(map.values());
  }, [filteredExamRecords]);

  /* =========================================================
     GATE RANK HOLDERS
  ========================================================= */

  const gateRankHolders = useMemo(() => {
    return filteredExamRecords.filter(
      (record) =>
        record.exam_type
          ?.toLowerCase()
          .includes("gate") &&
        !!record.rank &&
        record.rank.trim() !== ""
    );
  }, [filteredExamRecords]);

  /* =========================================================
     BATCH-WISE STATISTICS
  ========================================================= */

  const batchBreakdown = useMemo(() => {
    return batches.map((batch) => {
      const higherRecords =
        higherEducation.filter(
          (record) =>
            record.student_batch === batch
        );

      const gateRecords =
        examRecords.filter(
          (record) =>
            record.student_batch === batch
        );

      const higherMap = new Map<string, boolean>();

      higherRecords.forEach((record) => {
        higherMap.set(
          studentKey(
            record.registered_number,
            record.student_name
          ),
          true
        );
      });

      const gateMap = new Map<string, boolean>();

      gateRecords.forEach((record) => {
        gateMap.set(
          studentKey(
            record.registered_number,
            record.student_name
          ),
          true
        );
      });

      const rankHolderRecords =
        gateRecords.filter(
          (record) =>
            record.exam_type
              ?.toLowerCase()
              .includes("gate") &&
            !!record.rank &&
            record.rank.trim() !== ""
        );

      return {
        batch,
        higherEducation:
          higherMap.size,
        gateStudents:
          gateMap.size,
        rankHolders:
          rankHolderRecords.length,
      };
    });
  }, [
    batches,
    higherEducation,
    examRecords,
  ]);

  /* =========================================================
     SELECTED BATCH DATA
  ========================================================= */

  const selectedBatchHigherEducation =
    useMemo(() => {
      if (batchFilter === "All") {
        return [];
      }

      return higherEducation.filter(
        (record) =>
          record.student_batch === batchFilter
      );
    }, [
      higherEducation,
      batchFilter,
    ]);

  const selectedBatchExamRecords =
    useMemo(() => {
      if (batchFilter === "All") {
        return [];
      }

      return examRecords.filter(
        (record) =>
          record.student_batch === batchFilter
      );
    }, [
      examRecords,
      batchFilter,
    ]);

  const selectedBatchRankHolders =
    useMemo(() => {
      return selectedBatchExamRecords.filter(
        (record) =>
          record.exam_type
            ?.toLowerCase()
            .includes("gate") &&
          !!record.rank &&
          record.rank.trim() !== ""
      );
    }, [selectedBatchExamRecords]);

  /* =========================================================
     EXCEL EXPORT
  ========================================================= */

  function handleExportExcel() {
    if (
      filteredHigherEducation.length === 0 &&
      filteredExamRecords.length === 0
    ) {
      alert(
        "No records available to export."
      );
      return;
    }

    const workbook =
      XLSX.utils.book_new();

    /* -----------------------------------------
       SUMMARY
    ----------------------------------------- */

    const summaryData = [
      {
        "Statistics":
          "Unique Higher Education Students",
        Count:
          uniqueHigherEducationStudents.length,
      },
      {
        "Statistics":
          "Total Higher Education Records",
        Count:
          filteredHigherEducation.length,
      },
      {
        "Statistics":
          "Unique GATE / Entrance Students",
        Count:
          uniqueGateStudents.length,
      },
      {
        "Statistics":
          "Total GATE / Entrance Records",
        Count:
          filteredExamRecords.length,
      },
      {
        "Statistics":
          "GATE Rank Holder Records",
        Count:
          gateRankHolders.length,
      },
    ];

    const summarySheet =
      XLSX.utils.json_to_sheet(
        summaryData
      );

    summarySheet["!cols"] = [
      { wch: 40 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      summarySheet,
      "Summary"
    );

    /* -----------------------------------------
       BATCH-WISE
    ----------------------------------------- */

    const batchSheetData =
      batchBreakdown.map((item) => ({
        Batch: item.batch,
        "Higher Education Students":
          item.higherEducation,
        "GATE / Entrance Students":
          item.gateStudents,
        "GATE Rank Holders":
          item.rankHolders,
      }));

    const batchSheet =
      XLSX.utils.json_to_sheet(
        batchSheetData
      );

    batchSheet["!cols"] = [
      { wch: 15 },
      { wch: 28 },
      { wch: 28 },
      { wch: 22 },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      batchSheet,
      "Batch-wise Statistics"
    );

    /* -----------------------------------------
       HIGHER EDUCATION
    ----------------------------------------- */

    const higherSheetData =
      filteredHigherEducation.map(
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
          Institution:
            record.institution_name || "",
          Location:
            record.institution_location || "",
          "Admission Year":
            record.admission_year ?? "",
        })
      );

    const higherSheet =
      XLSX.utils.json_to_sheet(
        higherSheetData
      );

    higherSheet["!cols"] = [
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
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      higherSheet,
      "Higher Education"
    );

    /* -----------------------------------------
       GATE / ENTRANCE
    ----------------------------------------- */

    const gateSheetData =
      filteredExamRecords.map(
        (record, index) => ({
          "S.No.": index + 1,
          "Student Name":
            record.student_name || "",
          "Registered Number":
            record.registered_number || "",
          Batch:
            record.student_batch || "",
          "Exam Type":
            record.exam_type || "",
          "Exam Year":
            record.exam_year ?? "",
          "Score Type":
            record.score_type || "",
          Score:
            record.score ?? "",
          "GATE ME Score":
            record.gate_me_score ?? "",
          "GATE XE Score":
            record.gate_xe_score ?? "",
          Rank:
            record.rank || "",
        })
      );

    const gateSheet =
      XLSX.utils.json_to_sheet(
        gateSheetData
      );

    gateSheet["!cols"] = [
      { wch: 8 },
      { wch: 30 },
      { wch: 22 },
      { wch: 15 },
      { wch: 18 },
      { wch: 14 },
      { wch: 15 },
      { wch: 12 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      gateSheet,
      "GATE Entrance"
    );

    XLSX.writeFile(
      workbook,
      "ANITS_User_Database_Statistics.xlsx"
    );
  }

  /* =========================================================
     PRINT
  ========================================================= */

  function handlePrintSelectedBatch() {
    if (batchFilter === "All") {
      alert(
        "Please select a specific batch before printing."
      );
      return;
    }

    const hasData =
      selectedBatchHigherEducation.length > 0 ||
      selectedBatchExamRecords.length > 0;

    if (!hasData) {
      alert(
        "No records available for the selected batch."
      );
      return;
    }

    window.print();
  }

  /* =========================================================
     RESET
  ========================================================= */

  function handleResetFilters() {
    setSearch("");
    setBatchFilter("All");
    setAdmissionYearFilter("All");
    setGateYearFilter("All");
  }

  /* =========================================================
     DASHBOARD
  ========================================================= */

  function goToDashboard() {
    window.location.href =
      "/user-dashboard";
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="rounded-xl bg-white px-8 py-6 shadow">
          <p className="text-lg font-semibold text-gray-700">
            Loading statistics...
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     SCREEN
  ========================================================= */

  return (
    <>
      <main className="min-h-screen bg-gray-100 p-6 print:hidden">
        <div className="mx-auto max-w-7xl">

          {/* HEADER */}

          <div className="mb-6 rounded-xl bg-white p-6 shadow">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Database Statistics
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Higher Education and GATE / Entrance Statistics
                </p>

                <p className="mt-1 text-xs font-medium text-blue-600">
                  View-only access
                </p>
              </div>

              <div className="flex flex-wrap gap-3">

                <button
                  onClick={handleExportExcel}
                  className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                >
                  📊 Export Excel
                </button>

                {batchFilter !== "All" && (
                  <button
                    onClick={
                      handlePrintSelectedBatch
                    }
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    🖨️ Print Selected Batch
                  </button>
                )}

                <button
                  onClick={goToDashboard}
                  className="rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-900"
                >
                  🏠 Dashboard
                </button>

              </div>
            </div>
          </div>

          {/* FILTERS */}

          <div className="mb-6 rounded-xl bg-white p-6 shadow">

            <h2 className="mb-5 text-lg font-bold text-gray-800">
              Filters
            </h2>

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
                  placeholder="Student / Reg. No. / Program / Exam..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="All">
                    All Batches
                  </option>

                  {batches.map((batch) => (
                    <option
                      key={batch}
                      value={batch ?? ""}
                    >
                      {batch}
                    </option>
                  ))}
                </select>
              </div>

              {/* ADMISSION YEAR */}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Higher Education Admission Year
                </label>

                <select
                  value={admissionYearFilter}
                  onChange={(e) =>
                    setAdmissionYearFilter(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="All">
                    All Years
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

              {/* GATE YEAR */}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  GATE / Entrance Year
                </label>

                <select
                  value={gateYearFilter}
                  onChange={(e) =>
                    setGateYearFilter(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="All">
                    All Years
                  </option>

                  {gateYears.map((year) => (
                    <option
                      key={year}
                      value={String(year)}
                    >
                      {year}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleResetFilters}
                className="rounded-lg bg-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-300"
              >
                Reset Filters
              </button>
            </div>

            {batchFilter === "All" ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                ℹ️ Select a specific batch to enable the Print / Save PDF option.
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                📌 Print is available only for the selected batch:
                <strong className="ml-1">
                  {batchFilter}
                </strong>
              </div>
            )}

          </div>

          {/* STATISTICS CARDS */}

          <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-5">

            <div className="rounded-xl bg-white p-5 shadow">
              <p className="text-sm text-gray-500">
                Unique Higher Education Students
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-700">
                {
                  uniqueHigherEducationStudents.length
                }
              </p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow">
              <p className="text-sm text-gray-500">
                Higher Education Records
              </p>

              <p className="mt-2 text-3xl font-bold text-indigo-700">
                {
                  filteredHigherEducation.length
                }
              </p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow">
              <p className="text-sm text-gray-500">
                Unique GATE / Entrance Students
              </p>

              <p className="mt-2 text-3xl font-bold text-green-700">
                {
                  uniqueGateStudents.length
                }
              </p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow">
              <p className="text-sm text-gray-500">
                GATE / Entrance Records
              </p>

              <p className="mt-2 text-3xl font-bold text-orange-600">
                {
                  filteredExamRecords.length
                }
              </p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow">
              <p className="text-sm text-gray-500">
                GATE Rank Holders
              </p>

              <p className="mt-2 text-3xl font-bold text-red-600">
                {
                  gateRankHolders.length
                }
              </p>
            </div>

          </div>

          {/* BATCH-WISE STATISTICS */}

          <div className="mb-6 rounded-xl bg-white p-6 shadow">

            <h2 className="mb-5 text-xl font-bold text-gray-800">
              Batch-wise Statistics
            </h2>

            <div className="overflow-x-auto">

              <table className="w-full border-collapse text-sm">

                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="border px-4 py-3 text-left">
                      Batch
                    </th>

                    <th className="border px-4 py-3 text-left">
                      Higher Education Students
                    </th>

                    <th className="border px-4 py-3 text-left">
                      GATE / Entrance Students
                    </th>

                    <th className="border px-4 py-3 text-left">
                      GATE Rank Holders
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {batchBreakdown.map(
                    (item) => (
                      <tr
                        key={item.batch}
                        className="hover:bg-gray-50"
                      >
                        <td className="border px-4 py-3 font-medium">
                          {item.batch}
                        </td>

                        <td className="border px-4 py-3">
                          {item.higherEducation}
                        </td>

                        <td className="border px-4 py-3">
                          {item.gateStudents}
                        </td>

                        <td className="border px-4 py-3">
                          {item.rankHolders}
                        </td>
                      </tr>
                    )
                  )}

                  {batchBreakdown.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="border px-4 py-8 text-center text-gray-500"
                      >
                        No batch statistics available.
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>
          </div>

          {/* SELECTED BATCH */}

          {batchFilter !== "All" && (
            <div className="mb-6 rounded-xl bg-white p-6 shadow">

              <h2 className="mb-2 text-xl font-bold text-gray-800">
                Selected Batch
              </h2>

              <p className="mb-5 text-sm text-gray-500">
                Statistics available for:
                <strong className="ml-1 text-gray-800">
                  {batchFilter}
                </strong>
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm text-blue-700">
                    Higher Education Records
                  </p>

                  <p className="mt-1 text-2xl font-bold text-blue-800">
                    {
                      selectedBatchHigherEducation.length
                    }
                  </p>
                </div>

                <div className="rounded-lg bg-green-50 p-4">
                  <p className="text-sm text-green-700">
                    GATE / Entrance Records
                  </p>

                  <p className="mt-1 text-2xl font-bold text-green-800">
                    {
                      selectedBatchExamRecords.length
                    }
                  </p>
                </div>

                <div className="rounded-lg bg-orange-50 p-4">
                  <p className="text-sm text-orange-700">
                    Rank Holder Records
                  </p>

                  <p className="mt-1 text-2xl font-bold text-orange-800">
                    {
                      selectedBatchRankHolders.length
                    }
                  </p>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>

      {/* =====================================================
          PRINT REPORT

          PRINT ONLY SELECTED BATCH.
          NO UNIQUE COUNTS.
          NO SCREEN FILTERS.
          NO BUTTONS.
          NO PROOF LINKS.
      ===================================================== */}

      <div className="hidden print:block">

        <div className="print-report">

          {/* LETTERHEAD */}

          <div className="letterhead">
            <img
              src="/anits_letterhead.png"
              alt="ANITS Department of Mechanical Engineering Letterhead"
            />
          </div>

          {/* TITLE */}

          <div className="print-title">

            <h1>
              DATABASE STATISTICS REPORT
            </h1>

            <h2>
              Higher Education and GATE / Entrance Statistics
            </h2>

            <h3>
              Batch: {batchFilter}
            </h3>

          </div>

          {/* HIGHER EDUCATION */}

          <section className="print-section">

            <h2>
              1. Higher Education Records
            </h2>

            {selectedBatchHigherEducation.length ===
            0 ? (
              <p className="no-data">
                No Higher Education records available for this batch.
              </p>
            ) : (
              <table>

                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>Student Name</th>
                    <th>Registered No.</th>
                    <th>Program Level</th>
                    <th>Program</th>
                    <th>Specialization</th>
                    <th>Institution</th>
                    <th>Admission Year</th>
                  </tr>
                </thead>

                <tbody>

                  {selectedBatchHigherEducation.map(
                    (record, index) => (
                      <tr key={record.id}>

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          {record.student_name || ""}
                        </td>

                        <td>
                          {record.registered_number || ""}
                        </td>

                        <td>
                          {record.program_level || ""}
                        </td>

                        <td>
                          {record.program_name || ""}
                        </td>

                        <td>
                          {record.specialization || ""}
                        </td>

                        <td>
                          {record.institution_name || ""}
                          {record.institution_location
                            ? `, ${record.institution_location}`
                            : ""}
                        </td>

                        <td>
                          {record.admission_year ?? ""}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>
            )}

          </section>

          {/* GATE / ENTRANCE */}

          <section className="print-section">

            <h2>
              2. GATE / Entrance Examination Records
            </h2>

            {selectedBatchExamRecords.length ===
            0 ? (
              <p className="no-data">
                No GATE / Entrance records available for this batch.
              </p>
            ) : (
              <table>

                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>Student Name</th>
                    <th>Registered No.</th>
                    <th>Exam Type</th>
                    <th>Exam Year</th>
                    <th>Score Type</th>
                    <th>Score</th>
                    <th>GATE ME</th>
                    <th>GATE XE</th>
                    <th>Rank</th>
                  </tr>
                </thead>

                <tbody>

                  {selectedBatchExamRecords.map(
                    (record, index) => (
                      <tr key={record.id}>

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          {record.student_name || ""}
                        </td>

                        <td>
                          {record.registered_number || ""}
                        </td>

                        <td>
                          {record.exam_type || ""}
                        </td>

                        <td>
                          {record.exam_year ?? ""}
                        </td>

                        <td>
                          {record.score_type || ""}
                        </td>

                        <td>
                          {record.score ?? ""}
                        </td>

                        <td>
                          {record.gate_me_score ?? ""}
                        </td>

                        <td>
                          {record.gate_xe_score ?? ""}
                        </td>

                        <td>
                          {record.rank || ""}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>
            )}

          </section>

          {/* GATE RANK HOLDERS */}

          <section className="print-section">

            <h2>
              3. GATE Rank Holders
            </h2>

            {selectedBatchRankHolders.length ===
            0 ? (
              <p className="no-data">
                No GATE rank-holder records available for this batch.
              </p>
            ) : (
              <table>

                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>Student Name</th>
                    <th>Registered No.</th>
                    <th>Exam Year</th>
                    <th>Rank</th>
                  </tr>
                </thead>

                <tbody>

                  {selectedBatchRankHolders.map(
                    (record, index) => (
                      <tr key={record.id}>

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          {record.student_name || ""}
                        </td>

                        <td>
                          {record.registered_number || ""}
                        </td>

                        <td>
                          {record.exam_year ?? ""}
                        </td>

                        <td>
                          {record.rank || ""}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>
            )}

          </section>

        </div>
      </div>

      {/* =====================================================
          PRINT CSS
      ===================================================== */}

      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          body {
            background: white !important;
            margin: 0;
            padding: 0;
          }

          .print-report {
            width: 100%;
            background: white;
            color: black;
            font-family: Arial, Helvetica, sans-serif;
          }

          .letterhead {
            width: 100%;
            text-align: center;
            margin-bottom: 8px;
          }

          .letterhead img {
            width: 100%;
            max-height: 115px;
            object-fit: contain;
          }

          .print-title {
            text-align: center;
            margin: 8px 0 18px 0;
          }

          .print-title h1 {
            font-size: 18px;
            font-weight: 700;
            margin: 0;
          }

          .print-title h2 {
            font-size: 14px;
            font-weight: 600;
            margin: 5px 0;
          }

          .print-title h3 {
            font-size: 13px;
            font-weight: 700;
            margin: 5px 0 0 0;
          }

          .print-section {
            margin-bottom: 18px;
            page-break-inside: auto;
          }

          .print-section h2 {
            font-size: 14px;
            font-weight: 700;
            margin: 10px 0 7px 0;
            padding-bottom: 4px;
            border-bottom: 1px solid #333;
          }

          .print-section table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
          }

          .print-section th {
            background: #e5e7eb !important;
            color: black !important;
            border: 1px solid #333;
            padding: 5px 4px;
            font-weight: 700;
            text-align: center;
          }

          .print-section td {
            border: 1px solid #555;
            padding: 4px;
            vertical-align: top;
          }

          .print-section tr {
            page-break-inside: avoid;
          }

          .print-section thead {
            display: table-header-group;
          }

          .no-data {
            font-size: 10px;
            font-style: italic;
          }
        }
      `}</style>
    </>
  );
}

