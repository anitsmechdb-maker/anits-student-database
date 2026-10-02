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

  return `name:${(studentName || "")
    .trim()
    .toLowerCase()}`;
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminStatisticsPage() {
  const [higherEducation, setHigherEducation] = useState<
    HigherEducationRecord[]
  >([]);

  const [examRecords, setExamRecords] = useState<
    ExamRecord[]
  >([]);

  const [loading, setLoading] = useState(true);

  /* FILTERS */

  const [search, setSearch] = useState("");

  const [batchFilter, setBatchFilter] =
    useState("All");

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
    const values = [
      ...higherEducation.map(
        (item) => item.student_batch
      ),
      ...examRecords.map(
        (item) => item.student_batch
      ),
    ].filter(Boolean) as string[];

    return Array.from(new Set(values)).sort();
  }, [higherEducation, examRecords]);

  const admissionYears = useMemo(() => {
    return Array.from(
      new Set(
        higherEducation
          .map(
            (item) => item.admission_year
          )
          .filter(
            (year): year is number =>
              year !== null
          )
      )
    ).sort((a, b) => b - a);
  }, [higherEducation]);

  const gateYears = useMemo(() => {
    return Array.from(
      new Set(
        examRecords
          .map((item) => item.exam_year)
          .filter(
            (year): year is number =>
              year !== null
          )
      )
    ).sort((a, b) => b - a);
  }, [examRecords]);

  /* =========================================================
     SEARCH
  ========================================================= */

  const searchText = search
    .trim()
    .toLowerCase();

  /* =========================================================
     FILTERED HIGHER EDUCATION
  ========================================================= */

  const filteredHigherEducation = useMemo(() => {
    return higherEducation.filter((record) => {
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
          .includes(searchText);

      const matchesBatch =
        batchFilter === "All" ||
        record.student_batch ===
          batchFilter;

      const matchesAdmissionYear =
        admissionYearFilter === "All" ||
        String(
          record.admission_year || ""
        ) === admissionYearFilter;

      return (
        matchesSearch &&
        matchesBatch &&
        matchesAdmissionYear
      );
    });
  }, [
    higherEducation,
    searchText,
    batchFilter,
    admissionYearFilter,
  ]);

  /* =========================================================
     FILTERED EXAM RECORDS
  ========================================================= */

  const filteredExamRecords = useMemo(() => {
    return examRecords.filter((record) => {
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

      const matchesBatch =
        batchFilter === "All" ||
        record.student_batch ===
          batchFilter;

      const matchesGateYear =
        gateYearFilter === "All" ||
        String(
          record.exam_year || ""
        ) === gateYearFilter;

      return (
        matchesSearch &&
        matchesBatch &&
        matchesGateYear
      );
    });
  }, [
    examRecords,
    searchText,
    batchFilter,
    gateYearFilter,
  ]);

  /* =========================================================
     UNIQUE HIGHER EDUCATION STUDENTS
  ========================================================= */

  const uniqueHigherEducationStudents =
    useMemo(() => {
      const map = new Map<
        string,
        HigherEducationRecord
      >();

      filteredHigherEducation.forEach(
        (record) => {
          const key = studentKey(
            record.registered_number,
            record.student_name
          );

          if (!map.has(key)) {
            map.set(key, record);
          }
        }
      );

      return Array.from(map.values());
    }, [filteredHigherEducation]);

  /* =========================================================
     UNIQUE GATE STUDENTS
  ========================================================= */

  const uniqueGateStudents = useMemo(() => {
    const map = new Map<
      string,
      ExamRecord
    >();

    filteredExamRecords.forEach(
      (record) => {
        const key = studentKey(
          record.registered_number,
          record.student_name
        );

        if (!map.has(key)) {
          map.set(key, record);
        }
      }
    );

    return Array.from(map.values());
  }, [filteredExamRecords]);

  /* =========================================================
     GATE RANK HOLDERS
  ========================================================= */

  const gateRankHolders = useMemo(() => {
    const map = new Map<
      string,
      ExamRecord
    >();

    filteredExamRecords.forEach(
      (record) => {
        if (
          record.rank &&
          record.rank.trim()
        ) {
          const key = studentKey(
            record.registered_number,
            record.student_name
          );

          if (!map.has(key)) {
            map.set(key, record);
          }
        }
      }
    );

    return Array.from(map.values());
  }, [filteredExamRecords]);

  /* =========================================================
     PROGRAM LEVEL BREAKDOWN
  ========================================================= */

  const programLevelBreakdown =
    useMemo(() => {
      const map = new Map<
        string,
        Set<string>
      >();

      filteredHigherEducation.forEach(
        (record) => {
          const level =
            record.program_level ||
            "Not Specified";

          const key = studentKey(
            record.registered_number,
            record.student_name
          );

          if (!map.has(level)) {
            map.set(
              level,
              new Set<string>()
            );
          }

          map.get(level)!.add(key);
        }
      );

      return Array.from(map.entries())
        .map(([level, students]) => ({
          level,
          count: students.size,
        }))
        .sort((a, b) =>
          a.level.localeCompare(b.level)
        );
    }, [filteredHigherEducation]);

  /* =========================================================
     BATCH BREAKDOWN
  ========================================================= */

  const batchBreakdown = useMemo(() => {
    const allBatches = new Set<string>();

    higherEducation.forEach((record) => {
      allBatches.add(
        record.student_batch ||
          "Not Specified"
      );
    });

    examRecords.forEach((record) => {
      allBatches.add(
        record.student_batch ||
          "Not Specified"
      );
    });

    return Array.from(allBatches)
      .sort()
      .map((batch) => {
        const higherKeys =
          new Set<string>();

        higherEducation
          .filter(
            (record) =>
              (record.student_batch ||
                "Not Specified") ===
              batch
          )
          .forEach((record) => {
            higherKeys.add(
              studentKey(
                record.registered_number,
                record.student_name
              )
            );
          });

        const gateKeys =
          new Set<string>();

        examRecords
          .filter(
            (record) =>
              (record.student_batch ||
                "Not Specified") ===
              batch
          )
          .forEach((record) => {
            gateKeys.add(
              studentKey(
                record.registered_number,
                record.student_name
              )
            );
          });

        const rankKeys =
          new Set<string>();

        examRecords
          .filter(
            (record) =>
              (record.student_batch ||
                "Not Specified") ===
                batch &&
              record.rank &&
              record.rank.trim()
          )
          .forEach((record) => {
            rankKeys.add(
              studentKey(
                record.registered_number,
                record.student_name
              )
            );
          });

        return {
          batch,
          higherEducation:
            higherKeys.size,
          gateStudents:
            gateKeys.size,
          rankHolders:
            rankKeys.size,
        };
      });
  }, [higherEducation, examRecords]);

  /* =========================================================
     SELECTED BATCH DATA FOR PRINT
     
     IMPORTANT:
     PRINT USES ONLY THE SELECTED BATCH.
     Other filters/search are NOT used for print.
  ========================================================= */

  const selectedBatchHigherEducation =
    useMemo(() => {
      if (batchFilter === "All") {
        return [];
      }

      return higherEducation.filter(
        (record) =>
          (record.student_batch ||
            "Not Specified") ===
          batchFilter
      );
    }, [higherEducation, batchFilter]);

  const selectedBatchExamRecords =
    useMemo(() => {
      if (batchFilter === "All") {
        return [];
      }

      return examRecords.filter(
        (record) =>
          (record.student_batch ||
            "Not Specified") ===
          batchFilter
      );
    }, [examRecords, batchFilter]);

  const selectedBatchRankHolders =
    useMemo(() => {
      if (batchFilter === "All") {
        return [];
      }

      return selectedBatchExamRecords.filter(
        (record) =>
          record.rank &&
          record.rank.trim()
      );
    }, [selectedBatchExamRecords, batchFilter]);

  /* =========================================================
     EXCEL EXPORT
  ========================================================= */

  function handleExportExcel() {
    if (
      filteredHigherEducation.length ===
        0 &&
      filteredExamRecords.length === 0
    ) {
      alert(
        "No records available to export."
      );
      return;
    }

    const workbook =
      XLSX.utils.book_new();

    /* SUMMARY */

    const summaryData = [
      {
        Metric:
          "Unique Higher Education Students",
        Count:
          uniqueHigherEducationStudents.length,
      },
      {
        Metric:
          "Total Higher Education Records",
        Count:
          filteredHigherEducation.length,
      },
      {
        Metric:
          "Unique GATE / Entrance Students",
        Count:
          uniqueGateStudents.length,
      },
      {
        Metric:
          "Total GATE / Entrance Records",
        Count:
          filteredExamRecords.length,
      },
      {
        Metric:
          "Unique GATE Rank Holders",
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

    /* BATCH BREAKDOWN */

    const batchSheetData =
      batchBreakdown.map((item) => ({
        Batch: item.batch,
        "Higher Education Students":
          item.higherEducation,
        "GATE Students":
          item.gateStudents,
        "GATE Rank Holders":
          item.rankHolders,
      }));

    const batchSheet =
      XLSX.utils.json_to_sheet(
        batchSheetData
      );

    batchSheet["!cols"] = [
      { wch: 20 },
      { wch: 25 },
      { wch: 20 },
      { wch: 22 },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      batchSheet,
      "Batch Breakdown"
    );

    /* HIGHER EDUCATION */

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
      { wch: 35 },
      { wch: 45 },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      higherSheet,
      "Higher Education"
    );

    /* GATE */

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
          Remarks:
            record.remarks || "",
          "Proof Link":
            record.proof_link || "",
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
      { wch: 35 },
      { wch: 45 },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      gateSheet,
      "GATE / Entrance"
    );

    XLSX.writeFile(
      workbook,
      "ANITS_Database_Statistics.xlsx"
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
      selectedBatchHigherEducation.length >
        0 ||
      selectedBatchExamRecords.length >
        0;

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
    window.location.href = "/admin";
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
                  Higher Education and GATE Statistics
                </p>
              </div>

              <button
                onClick={goToDashboard}
                className="rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-900"
              >
                🏠 Dashboard
              </button>

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
                  placeholder="Student / Reg. No. / Program..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="All">
                    All Batches
                  </option>

                  {batches.map((batch) => (
                    <option
                      key={batch}
                      value={batch}
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
                  GATE / Exam Year
                </label>

                <select
                  value={gateYearFilter}
                  onChange={(e) =>
                    setGateYearFilter(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
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

              {/* PRINT BUTTON ONLY WHEN SPECIFIC BATCH IS SELECTED */}

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

            </div>

            {/* PRINT INFORMATION */}

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
                Total Higher Education Records
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
                Total GATE / Entrance Records
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

          {/* BATCH BREAKDOWN */}

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
                      GATE Students
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

                </tbody>

              </table>

            </div>

          </div>

          {/* PROGRAM LEVEL */}

          <div className="mb-6 rounded-xl bg-white p-6 shadow">

            <h2 className="mb-5 text-xl font-bold text-gray-800">
              Higher Education — Program Level
            </h2>

            <div className="overflow-x-auto">

              <table className="w-full border-collapse text-sm">

                <thead className="bg-gray-800 text-white">

                  <tr>
                    <th className="border px-4 py-3 text-left">
                      Program Level
                    </th>

                    <th className="border px-4 py-3 text-left">
                      Unique Students
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {programLevelBreakdown.map(
                    (item) => (
                      <tr
                        key={item.level}
                        className="hover:bg-gray-50"
                      >

                        <td className="border px-4 py-3">
                          {item.level}
                        </td>

                        <td className="border px-4 py-3">
                          {item.count}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

          {/* SELECTED BATCH PREVIEW */}

          {batchFilter !== "All" && (
            <div className="mb-6 rounded-xl bg-white p-6 shadow">

              <h2 className="mb-2 text-xl font-bold text-gray-800">
                Selected Batch
              </h2>

              <p className="mb-5 text-sm text-gray-500">
                Detailed records available for print:
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
          
          THIS SECTION IS SHOWN ONLY DURING PRINT.
          
          NO UNIQUE COUNTS.
          NO OVERALL SUMMARY.
          ONLY SELECTED BATCH.
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
              Higher Education and GATE Statistics
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
                          {record.student_name ||
                            ""}
                        </td>

                        <td>
                          {record.registered_number ||
                            ""}
                        </td>

                        <td>
                          {record.program_level ||
                            ""}
                        </td>

                        <td>
                          {record.program_name ||
                            ""}
                        </td>

                        <td>
                          {record.specialization ||
                            ""}
                        </td>

                        <td>
                          {record.institution_name ||
                            ""}
                          {record.institution_location
                            ? `, ${record.institution_location}`
                            : ""}
                        </td>

                        <td>
                          {record.admission_year ??
                            ""}
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
                No GATE / Entrance examination records available for this batch.
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
                          {record.student_name ||
                            ""}
                        </td>

                        <td>
                          {record.registered_number ||
                            ""}
                        </td>

                        <td>
                          {record.exam_type ||
                            ""}
                        </td>

                        <td>
                          {record.exam_year ??
                            ""}
                        </td>

                        <td>
                          {record.score ??
                            ""}
                        </td>

                        <td>
                          {record.gate_me_score ??
                            ""}
                        </td>

                        <td>
                          {record.gate_xe_score ??
                            ""}
                        </td>

                        <td>
                          {record.rank ||
                            ""}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>
            )}

          </section>

          {/* RANK HOLDERS */}

          <section className="print-section">

            <h2>
              3. GATE Rank Holders
            </h2>

            {selectedBatchRankHolders.length ===
            0 ? (
              <p className="no-data">
                No GATE rank holder records available for this batch.
              </p>
            ) : (
              <table>

                <thead>

                  <tr>
                    <th>S.No.</th>
                    <th>Student Name</th>
                    <th>Registered No.</th>
                    <th>Exam Year</th>
                    <th>Exam Type</th>
                    <th>GATE ME Score</th>
                    <th>GATE XE Score</th>
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
                          {record.student_name ||
                            ""}
                        </td>

                        <td>
                          {record.registered_number ||
                            ""}
                        </td>

                        <td>
                          {record.exam_year ??
                            ""}
                        </td>

                        <td>
                          {record.exam_type ||
                            ""}
                        </td>

                        <td>
                          {record.gate_me_score ??
                            ""}
                        </td>

                        <td>
                          {record.gate_xe_score ??
                            ""}
                        </td>

                        <td>
                          {record.rank ||
                            ""}
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

          .print-report {
            width: 100%;
            color: #000;
            font-family: Arial, Helvetica, sans-serif;
          }

          .letterhead {
            width: 100%;
            margin-bottom: 8px;
            text-align: center;
          }

          .letterhead img {
            width: 100%;
            max-height: 105px;
            object-fit: contain;
          }

          .print-title {
            text-align: center;
            margin: 8px 0 18px 0;
          }

          .print-title h1 {
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 5px 0;
          }

          .print-title h2 {
            font-size: 13px;
            font-weight: 500;
            margin: 0 0 6px 0;
          }

          .print-title h3 {
            font-size: 14px;
            font-weight: 700;
            margin: 0;
          }

          .print-section {
            margin-top: 18px;
            page-break-inside: auto;
          }

          .print-section h2 {
            font-size: 14px;
            font-weight: 700;
            margin: 0 0 8px 0;
            border-bottom: 1px solid #000;
            padding-bottom: 4px;
          }

          .print-section table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
            page-break-inside: auto;
          }

          .print-section thead {
            display: table-header-group;
          }

          .print-section tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          .print-section th,
          .print-section td {
            border: 1px solid #333;
            padding: 4px 5px;
            vertical-align: middle;
            text-align: left;
          }

          .print-section th {
            font-weight: 700;
            text-align: center;
          }

          .no-data {
            font-size: 10px;
            margin: 8px 0;
          }

        }

      `}</style>
    </>
  );
}