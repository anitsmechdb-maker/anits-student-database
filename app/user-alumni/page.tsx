"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

type ActiveTab = "meetings" | "academic" | "financial";

type Meeting = {
  id: string;
  activity_date: string | null;
  department: string | null;
  activity_name: string | null;
  alumni_present: number | null;
  proof_link: string | null;
};

type AcademicContribution = {
  id: string;
  contribution_date: string | null;
  alumni_name: string | null;
  alumni_roll_number: string | null;
  contribution_type: string | null;
  contribution_details: string | null;
  students_benefited: number | null;
  proof_link: string | null;
};

type FinancialContribution = {
  id: string;
  contribution_date: string | null;
  alumni_name: string | null;
  alumni_roll_number: string | null;
  amount: number | null;
  sponsored_for: string | null;
  proof_link: string | null;
};

const academicContributionTypes = [
  "Guest Lecture",
  "Technical Talk",
  "Workshop",
  "Mentoring",
  "Project Guidance",
  "Internship Support",
  "Placement Support",
  "Other",
];

function formatDate(value: string | null) {
  if (!value) return "-";
  return value;
}

export default function UserAlumniPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("meetings");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [academic, setAcademic] = useState<AcademicContribution[]>([]);
  const [financial, setFinancial] = useState<FinancialContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [meetingSearch, setMeetingSearch] = useState("");
  const [meetingDepartment, setMeetingDepartment] = useState("");
  const [meetingFromDate, setMeetingFromDate] = useState("");
  const [meetingToDate, setMeetingToDate] = useState("");

  const [academicSearch, setAcademicSearch] = useState("");
  const [academicType, setAcademicType] = useState("");

  const [financialSearch, setFinancialSearch] = useState("");
  const [financialDate, setFinancialDate] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    const [meetingsResult, academicResult, financialResult] =
      await Promise.all([
        supabase
          .from("alumni_meetings")
          .select(
            "id, activity_date, department, activity_name, alumni_present, proof_link"
          )
          .order("activity_date", { ascending: false }),
        supabase
          .from("alumni_academic_contributions")
          .select(
            "id, contribution_date, alumni_name, alumni_roll_number, contribution_type, contribution_details, students_benefited, proof_link"
          )
          .order("contribution_date", { ascending: false }),
        supabase
          .from("alumni_financial_contributions")
          .select(
            "id, contribution_date, alumni_name, alumni_roll_number, amount, sponsored_for, proof_link"
          )
          .order("contribution_date", { ascending: false }),
      ]);

    if (meetingsResult.error) {
      setError(meetingsResult.error.message);
      setLoading(false);
      return;
    }
    if (academicResult.error) {
      setError(academicResult.error.message);
      setLoading(false);
      return;
    }
    if (financialResult.error) {
      setError(financialResult.error.message);
      setLoading(false);
      return;
    }

    setMeetings((meetingsResult.data || []) as Meeting[]);
    setAcademic((academicResult.data || []) as AcademicContribution[]);
    setFinancial((financialResult.data || []) as FinancialContribution[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const departments = useMemo(() => {
    return Array.from(
      new Set(
        meetings
          .map((item) => item.department)
          .filter((value): value is string => Boolean(value))
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [meetings]);

  const filteredMeetings = useMemo(() => {
    const search = meetingSearch.trim().toLowerCase();
    return meetings.filter((item) => {
      const matchesSearch =
        !search ||
        (item.department || "").toLowerCase().includes(search) ||
        (item.activity_name || "").toLowerCase().includes(search);
      const matchesDepartment =
        !meetingDepartment || item.department === meetingDepartment;
      const matchesFromDate =
        !meetingFromDate ||
        (!!item.activity_date && item.activity_date >= meetingFromDate);
      const matchesToDate =
        !meetingToDate ||
        (!!item.activity_date && item.activity_date <= meetingToDate);
      return (
        matchesSearch &&
        matchesDepartment &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [
    meetings,
    meetingSearch,
    meetingDepartment,
    meetingFromDate,
    meetingToDate,
  ]);

  const filteredAcademic = useMemo(() => {
    const search = academicSearch.trim().toLowerCase();
    return academic.filter((item) => {
      const matchesSearch =
        !search ||
        (item.alumni_name || "").toLowerCase().includes(search) ||
        (item.alumni_roll_number || "").toLowerCase().includes(search) ||
        (item.contribution_details || "").toLowerCase().includes(search);
      const matchesType =
        !academicType || item.contribution_type === academicType;
      return matchesSearch && matchesType;
    });
  }, [academic, academicSearch, academicType]);

  const filteredFinancial = useMemo(() => {
    const search = financialSearch.trim().toLowerCase();
    return financial.filter((item) => {
      const matchesSearch =
        !search ||
        (item.alumni_name || "").toLowerCase().includes(search) ||
        (item.alumni_roll_number || "").toLowerCase().includes(search) ||
        (item.sponsored_for || "").toLowerCase().includes(search);
      const matchesDate =
        !financialDate || item.contribution_date === financialDate;
      return matchesSearch && matchesDate;
    });
  }, [financial, financialSearch, financialDate]);

  const currentRecordCount =
    activeTab === "meetings"
      ? filteredMeetings.length
      : activeTab === "academic"
      ? filteredAcademic.length
      : filteredFinancial.length;

  function getPrintTitle() {
    if (activeTab === "meetings") return "ALUMNI MEETINGS";
    if (activeTab === "academic") return "ALUMNI ACADEMIC CONTRIBUTIONS";
    return "ALUMNI FINANCIAL CONTRIBUTIONS";
  }

  function clearFilters() {
    if (activeTab === "meetings") {
      setMeetingSearch("");
      setMeetingDepartment("");
      setMeetingFromDate("");
      setMeetingToDate("");
    } else if (activeTab === "academic") {
      setAcademicSearch("");
      setAcademicType("");
    } else {
      setFinancialSearch("");
      setFinancialDate("");
    }
  }

  function handlePrint() {
    window.print();
  }

  function exportToExcel() {
    const workbook = XLSX.utils.book_new();

    if (activeTab === "meetings") {
      const data = filteredMeetings.map((item, index) => ({
        "S.No.": index + 1,
        Date: item.activity_date || "",
        Department: item.department || "",
        Activity: item.activity_name || "",
        "Alumni Present": item.alumni_present ?? "",
        "Proof Link": item.proof_link || "",
      }));
      const sheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, sheet, "Alumni Meetings");
      XLSX.writeFile(workbook, "ANITS_User_Alumni_Meetings.xlsx");
      return;
    }

    if (activeTab === "academic") {
      const data = filteredAcademic.map((item, index) => ({
        "S.No.": index + 1,
        Date: item.contribution_date || "",
        "Alumni Name": item.alumni_name || "",
        "Alumni Roll Number": item.alumni_roll_number || "",
        "Contribution Type": item.contribution_type || "",
        "Contribution Details": item.contribution_details || "",
        "Students Benefited": item.students_benefited ?? "",
        "Proof Link": item.proof_link || "",
      }));
      const sheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(
        workbook,
        sheet,
        "Academic Contributions"
      );
      XLSX.writeFile(
        workbook,
        "ANITS_User_Alumni_Academic_Contributions.xlsx"
      );
      return;
    }

    const data = filteredFinancial.map((item, index) => ({
      "S.No.": index + 1,
      Date: item.contribution_date || "",
      "Alumni Name": item.alumni_name || "",
      "Alumni Roll Number": item.alumni_roll_number || "",
      Amount: item.amount ?? "",
      "Sponsored For": item.sponsored_for || "",
      "Proof Link": item.proof_link || "",
    }));
    const sheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(
      workbook,
      sheet,
      "Financial Contributions"
    );
    XLSX.writeFile(
      workbook,
      "ANITS_User_Alumni_Financial_Contributions.xlsx"
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Alumni Contributions
            </h1>
            <p className="mt-1 text-gray-500">
              View-only Alumni Meetings, Academic and Financial Contributions
            </p>
          </div>
          <a
            href="/user-dashboard"
            className="rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700"
          >
            Back to User Dashboard
          </a>
        </div>

        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 print:hidden">
          <strong>View Only:</strong> Alumni contribution records can be
          viewed, searched, filtered, printed and exported. Records cannot be
          added, edited or deleted from this account.
        </div>

        <div className="mb-5 flex flex-wrap gap-2 rounded-xl bg-white p-2 shadow-sm print:hidden">
          <button
            type="button"
            onClick={() => setActiveTab("meetings")}
            className={`rounded-lg px-5 py-2.5 font-semibold transition ${
              activeTab === "meetings"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Alumni Meetings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("academic")}
            className={`rounded-lg px-5 py-2.5 font-semibold transition ${
              activeTab === "academic"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Academic Contributions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("financial")}
            className={`rounded-lg px-5 py-2.5 font-semibold transition ${
              activeTab === "financial"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Financial Contributions
          </button>
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm print:hidden">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {getPrintTitle()}
            </h2>
            <p className="text-sm text-gray-500">
              Showing {currentRecordCount} record(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Print Preview
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-900"
            >
              Print
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              Save as PDF
            </button>
            <button
              type="button"
              onClick={exportToExcel}
              className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
            >
              Export Excel
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 print:hidden">
            {error}
          </div>
        )}

        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm print:hidden">
          {activeTab === "meetings" && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              <input
                type="text"
                placeholder="Search activity / department"
                value={meetingSearch}
                onChange={(e) => setMeetingSearch(e.target.value)}
                className="rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 lg:col-span-2"
              />
              <select
                value={meetingDepartment}
                onChange={(e) => setMeetingDepartment(e.target.value)}
                className="rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={meetingFromDate}
                onChange={(e) => setMeetingFromDate(e.target.value)}
                className="rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                title="From Date"
              />
              <input
                type="date"
                value={meetingToDate}
                onChange={(e) => setMeetingToDate(e.target.value)}
                className="rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                title="To Date"
              />
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg bg-gray-600 px-4 py-3 font-semibold text-white hover:bg-gray-700"
              >
                Clear Filters
              </button>
            </div>
          )}

          {activeTab === "academic" && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <input
                type="text"
                placeholder="Search name / roll number / details"
                value={academicSearch}
                onChange={(e) => setAcademicSearch(e.target.value)}
                className="rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
              />
              <select
                value={academicType}
                onChange={(e) => setAcademicType(e.target.value)}
                className="rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
              >
                <option value="">All Contribution Types</option>
                {academicContributionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg bg-gray-600 px-4 py-3 font-semibold text-white hover:bg-gray-700"
              >
                Clear Filters
              </button>
            </div>
          )}

          {activeTab === "financial" && (
            <div className="grid gap-3 md:grid-cols-3">
              <input
                type="text"
                placeholder="Search name / roll number / sponsored for"
                value={financialSearch}
                onChange={(e) => setFinancialSearch(e.target.value)}
                className="rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
              />
              <input
                type="date"
                value={financialDate}
                onChange={(e) => setFinancialDate(e.target.value)}
                className="rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                title="Contribution Date"
              />
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg bg-gray-600 px-4 py-3 font-semibold text-white hover:bg-gray-700"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        <div className="hidden print:block print-letterhead">
          <img
            src="/anits_letterhead.png"
            alt="ANITS Department of Mechanical Engineering Letterhead"
            className="w-full"
          />
        </div>

        <div className="hidden print:block print-title">
          <h1>{getPrintTitle()}</h1>
        </div>

        {loading ? (
          <div className="rounded-xl bg-white p-10 text-center text-gray-500">
            Loading alumni records...
          </div>
        ) : (
          <>
            {activeTab === "meetings" && (
              <section className="overflow-x-auto rounded-xl bg-white shadow-sm">
                <table className="w-full min-w-[850px] text-left">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-4">S.No.</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Activity</th>
                      <th className="p-4">Alumni Present</th>
                      <th className="p-4 print-hide-proof">Proof</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMeetings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">
                          No Alumni Meeting records found.
                        </td>
                      </tr>
                    ) : (
                      filteredMeetings.map((item, index) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-4">{index + 1}</td>
                          <td className="p-4">{formatDate(item.activity_date)}</td>
                          <td className="p-4">{item.department || "-"}</td>
                          <td className="p-4">{item.activity_name || "-"}</td>
                          <td className="p-4">{item.alumni_present ?? "-"}</td>
                          <td className="p-4 print-hide-proof">
                            {item.proof_link ? (
                              <a
                                href={item.proof_link}
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
                      ))
                    )}
                  </tbody>
                </table>
              </section>
            )}

            {activeTab === "academic" && (
              <section className="overflow-x-auto rounded-xl bg-white shadow-sm">
                <table className="w-full min-w-[1150px] text-left">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-4">S.No.</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Alumni Name</th>
                      <th className="p-4">Roll Number</th>
                      <th className="p-4">Contribution Type</th>
                      <th className="p-4">Details</th>
                      <th className="p-4">Students Benefited</th>
                      <th className="p-4 print-hide-proof">Proof</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAcademic.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-500">
                          No Academic Contribution records found.
                        </td>
                      </tr>
                    ) : (
                      filteredAcademic.map((item, index) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-4">{index + 1}</td>
                          <td className="p-4">{formatDate(item.contribution_date)}</td>
                          <td className="p-4">{item.alumni_name || "-"}</td>
                          <td className="p-4">{item.alumni_roll_number || "-"}</td>
                          <td className="p-4">{item.contribution_type || "-"}</td>
                          <td className="p-4">{item.contribution_details || "-"}</td>
                          <td className="p-4">{item.students_benefited ?? "-"}</td>
                          <td className="p-4 print-hide-proof">
                            {item.proof_link ? (
                              <a
                                href={item.proof_link}
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
                      ))
                    )}
                  </tbody>
                </table>
              </section>
            )}

            {activeTab === "financial" && (
              <section className="overflow-x-auto rounded-xl bg-white shadow-sm">
                <table className="w-full min-w-[950px] text-left">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-4">S.No.</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Alumni Name</th>
                      <th className="p-4">Roll Number</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Sponsored For</th>
                      <th className="p-4 print-hide-proof">Proof</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFinancial.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-500">
                          No Financial Contribution records found.
                        </td>
                      </tr>
                    ) : (
                      filteredFinancial.map((item, index) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-4">{index + 1}</td>
                          <td className="p-4">{formatDate(item.contribution_date)}</td>
                          <td className="p-4">{item.alumni_name || "-"}</td>
                          <td className="p-4">{item.alumni_roll_number || "-"}</td>
                          <td className="p-4">{item.amount ?? "-"}</td>
                          <td className="p-4">{item.sponsored_for || "-"}</td>
                          <td className="p-4 print-hide-proof">
                            {item.proof_link ? (
                              <a
                                href={item.proof_link}
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
                      ))
                    )}
                  </tbody>
                </table>
              </section>
            )}
          </>
        )}

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
              margin-bottom: 6mm !important;
            }

            .print-title {
              display: block !important;
              margin-bottom: 5mm !important;
              text-align: center !important;
            }

            .print-title h1 {
              margin: 0 !important;
              font-size: 17px !important;
              font-weight: 700 !important;
              color: #111 !important;
            }

            .print-hide-proof {
              display: none !important;
            }

            table {
              width: 100% !important;
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
              color: #111 !important;
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

            section {
              margin: 0 !important;
            }

            section.overflow-x-auto {
              overflow: visible !important;
              border-radius: 0 !important;
              box-shadow: none !important;
            }
          }
        `}</style>
      </div>
    </main>
  );
}
