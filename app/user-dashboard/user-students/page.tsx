"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
};

export default function UserStudentsPage() {
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");

  const [searchText, setSearchText] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");

  useEffect(() => {
    checkAccessAndLoad();
  }, []);

  async function checkAccessAndLoad() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/user-login");
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleError || roleData?.role !== "viewer") {
        await supabase.auth.signOut();
        router.replace("/user-login");
        return;
      }

      setAuthorized(true);

      const { data, error: studentsError } = await supabase
        .from("students")
        .select(
          "id, full_name, roll_number, batch, section, branch, graduation_year"
        )
        .order("full_name", { ascending: true });

      if (studentsError) {
        setError(studentsError.message);
        setStudents([]);
        return;
      }

      setStudents((data as Student[]) || []);
    } catch (err) {
      console.error("USER STUDENTS ERROR:", err);
      setError("Unable to load student records.");
    } finally {
      setLoading(false);
    }
  }

  const branches = useMemo(() => {
    return Array.from(
      new Set(
        students
          .map((student) => student.branch)
          .filter((value): value is string => Boolean(value))
      )
    ).sort();
  }, [students]);

  const sections = useMemo(() => {
    return Array.from(
      new Set(
        students
          .map((student) => student.section)
          .filter((value): value is string => Boolean(value))
      )
    ).sort();
  }, [students]);

  const batches = useMemo(() => {
    return Array.from(
      new Set(
        students
          .map((student) => student.batch)
          .filter((value): value is string => Boolean(value))
      )
    ).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !query ||
        student.full_name.toLowerCase().includes(query) ||
        student.roll_number.toLowerCase().includes(query) ||
        student.batch.toLowerCase().includes(query) ||
        (student.branch || "").toLowerCase().includes(query) ||
        (student.section || "").toLowerCase().includes(query);

      const matchesBranch =
        !branchFilter || student.branch === branchFilter;

      const matchesSection =
        !sectionFilter || student.section === sectionFilter;

      const matchesBatch =
        !batchFilter || student.batch === batchFilter;

      return (
        matchesSearch &&
        matchesBranch &&
        matchesSection &&
        matchesBatch
      );
    });
  }, [
    students,
    searchText,
    branchFilter,
    sectionFilter,
    batchFilter,
  ]);

  function clearFilters() {
    setSearchText("");
    setBranchFilter("");
    setSectionFilter("");
    setBatchFilter("");
  }

  function handlePrint() {
    window.print();
  }

  function handleExportExcel() {
    if (filteredStudents.length === 0) {
      alert("No records available to export.");
      return;
    }

    const exportData = filteredStudents.map((student, index) => ({
      "S.No.": index + 1,
      "Student Name": student.full_name,
      "Roll Number": student.roll_number,
      Batch: student.batch,
      Section: student.section || "",
      Branch: student.branch || "",
      "Graduation Year": student.graduation_year || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 30 },
      { wch: 18 },
      { wch: 15 },
      { wch: 12 },
      { wch: 20 },
      { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Students"
    );

    XLSX.writeFile(
      workbook,
      "ANITS_Student_Database.xlsx"
    );
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/user-login");
  }

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
            fontWeight: 600,
          }}
        >
          Loading Student Records...
        </div>
      </main>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        @media print {
          body {
            background: #ffffff !important;
            margin: 0 !important;
          }

          .no-print {
            display: none !important;
          }

          .print-area {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          .print-header {
            display: block !important;
          }

          .student-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 11px !important;
          }

          .student-table th,
          .student-table td {
            border: 1px solid #333333 !important;
            padding: 7px !important;
            color: #000000 !important;
          }

          .student-table th {
            background: #eeeeee !important;
          }
        }

        @media screen {
          .print-header {
            display: none;
          }
        }

        @media (max-width: 900px) {
          .filter-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        @media (max-width: 600px) {
          .filter-grid {
            grid-template-columns: 1fr !important;
          }

          .page-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
        }
      `}</style>

      <main
        className="print-area"
        style={{
          minHeight: "100vh",
          background: "#f5f7fa",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* HEADER */}
        <header
          className="no-print page-header"
          style={{
            background: "#0f3d75",
            color: "#ffffff",
            padding: "18px 30px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
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
              Student Database — View Only
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.14)",
                borderRadius: 20,
                padding: "8px 13px",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              User: mech@anits
            </div>

            <button
              type="button"
              onClick={() => router.push("/user-dashboard")}
              style={{
                border: "1px solid rgba(255,255,255,0.5)",
                background: "transparent",
                color: "#ffffff",
                borderRadius: 8,
                padding: "9px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ← Dashboard
            </button>

            <button
              type="button"
              onClick={logout}
              style={{
                border: "none",
                background: "#ffffff",
                color: "#0f3d75",
                borderRadius: 8,
                padding: "9px 15px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </header>

        {/* PRINT HEADER */}
        <div
          className="print-header"
          style={{
            padding: "15px 20px",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            ANIL NEERUKONDA INSTITUTE OF TECHNOLOGY &amp; SCIENCES
          </h1>

          <p
            style={{
              margin: "5px 0",
              fontSize: 13,
            }}
          >
            Department of Mechanical Engineering
          </p>

          <h2
            style={{
              margin: "10px 0 0",
              fontSize: 17,
            }}
          >
            Student Database
          </h2>

          <p
            style={{
              margin: "5px 0",
              fontSize: 11,
            }}
          >
            Total Records Printed: {filteredStudents.length}
          </p>
        </div>

        {/* CONTENT */}
        <section
          style={{
            maxWidth: 1350,
            margin: "0 auto",
            padding: "30px 25px 50px",
          }}
        >
          {/* TITLE */}
          <div
            className="no-print"
            style={{
              marginBottom: 22,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 27,
                color: "#172b4d",
              }}
            >
              Student Database
            </h2>

            <p
              style={{
                margin: "7px 0 0",
                color: "#667085",
                fontSize: 14,
              }}
            >
              View, search, filter, print and export student records.
            </p>
          </div>

          {/* SEARCH & FILTER */}
          <div
            className="no-print"
            style={{
              background: "#ffffff",
              border: "1px solid #e4e7ec",
              borderRadius: 12,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 15,
                flexWrap: "wrap",
                marginBottom: 18,
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    color: "#172b4d",
                    fontSize: 17,
                  }}
                >
                  Search &amp; Filter
                </h3>

                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#667085",
                    fontSize: 12,
                  }}
                >
                  Showing {filteredStudents.length} of{" "}
                  {students.length} records
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={handleExportExcel}
                  style={{
                    border: "none",
                    borderRadius: 8,
                    background: "#087443",
                    color: "#ffffff",
                    padding: "11px 17px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  📊 Export Excel
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  style={{
                    border: "none",
                    borderRadius: 8,
                    background: "#0f3d75",
                    color: "#ffffff",
                    padding: "11px 18px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  🖨️ Print / Save PDF
                </button>
              </div>
            </div>

            <div
              className="filter-grid"
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(250px, 2fr) repeat(3, minmax(160px, 1fr))",
                gap: 12,
              }}
            >
              {/* SEARCH */}
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    color: "#344054",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Search
                </label>

                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Name / Roll Number / Batch..."
                  style={{
                    width: "100%",
                    height: 43,
                    padding: "0 12px",
                    border: "1px solid #d0d5dd",
                    borderRadius: 8,
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>

              {/* BRANCH */}
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    color: "#344054",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Branch
                </label>

                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  style={{
                    width: "100%",
                    height: 43,
                    padding: "0 10px",
                    border: "1px solid #d0d5dd",
                    borderRadius: 8,
                    background: "#ffffff",
                    fontSize: 13,
                  }}
                >
                  <option value="">All Branches</option>

                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>

              {/* SECTION */}
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    color: "#344054",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Section
                </label>

                <select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  style={{
                    width: "100%",
                    height: 43,
                    padding: "0 10px",
                    border: "1px solid #d0d5dd",
                    borderRadius: 8,
                    background: "#ffffff",
                    fontSize: 13,
                  }}
                >
                  <option value="">All Sections</option>

                  {sections.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
              </div>

              {/* BATCH */}
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    color: "#344054",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Batch
                </label>

                <select
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                  style={{
                    width: "100%",
                    height: 43,
                    padding: "0 10px",
                    border: "1px solid #d0d5dd",
                    borderRadius: 8,
                    background: "#ffffff",
                    fontSize: 13,
                  }}
                >
                  <option value="">All Batches</option>

                  {batches.map((batch) => (
                    <option key={batch} value={batch}>
                      {batch}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  border: "1px solid #d0d5dd",
                  borderRadius: 7,
                  background: "#ffffff",
                  color: "#344054",
                  padding: "8px 13px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ✕ Clear Filters
              </button>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div
              className="no-print"
              style={{
                marginBottom: 18,
                padding: "12px 14px",
                borderRadius: 8,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {/* TABLE */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e4e7ec",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {filteredStudents.length === 0 ? (
              <div
                style={{
                  padding: 45,
                  textAlign: "center",
                  color: "#667085",
                  fontSize: 14,
                }}
              >
                {students.length === 0
                  ? "No student records found."
                  : "No student records match the selected filters."}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  className="student-table"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: 850,
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr>
                      {[
                        "S.No.",
                        "Student Name",
                        "Roll Number",
                        "Batch",
                        "Section",
                        "Branch",
                        "Graduation Year",
                      ].map((heading) => (
                        <th
                          key={heading}
                          style={{
                            background: "#eef4ff",
                            color: "#172b4d",
                            padding: "13px 12px",
                            textAlign: "left",
                            borderBottom: "1px solid #d0d5dd",
                            whiteSpace: "nowrap",
                            fontWeight: 700,
                          }}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStudents.map((student, index) => (
                      <tr key={student.id}>
                        <td
                          style={{
                            padding: "12px",
                            borderBottom: "1px solid #eaecf0",
                            color: "#667085",
                          }}
                        >
                          {index + 1}
                        </td>

                        <td
                          style={{
                            padding: "12px",
                            borderBottom: "1px solid #eaecf0",
                            fontWeight: 650,
                            color: "#172b4d",
                          }}
                        >
                          {student.full_name}
                        </td>

                        <td
                          style={{
                            padding: "12px",
                            borderBottom: "1px solid #eaecf0",
                            color: "#344054",
                          }}
                        >
                          {student.roll_number}
                        </td>

                        <td
                          style={{
                            padding: "12px",
                            borderBottom: "1px solid #eaecf0",
                            color: "#344054",
                          }}
                        >
                          {student.batch}
                        </td>

                        <td
                          style={{
                            padding: "12px",
                            borderBottom: "1px solid #eaecf0",
                            color: "#344054",
                          }}
                        >
                          {student.section || "-"}
                        </td>

                        <td
                          style={{
                            padding: "12px",
                            borderBottom: "1px solid #eaecf0",
                            color: "#344054",
                          }}
                        >
                          {student.branch || "-"}
                        </td>

                        <td
                          style={{
                            padding: "12px",
                            borderBottom: "1px solid #eaecf0",
                            color: "#344054",
                          }}
                        >
                          {student.graduation_year || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* NOTICE */}
          <div
            className="no-print"
            style={{
              marginTop: 18,
              padding: "12px 15px",
              background: "#ffffff",
              border: "1px solid #e4e7ec",
              borderRadius: 9,
              color: "#667085",
              fontSize: 12,
            }}
          >
            🔒 <strong>View-only account:</strong> Student records can be
            viewed, searched, filtered, printed and exported. Add, Edit and
            Delete operations are not available.
          </div>
        </section>
      </main>
    </>
  );
}