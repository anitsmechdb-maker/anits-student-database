"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

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

export default function AlumniPage() {
  const [activeTab, setActiveTab] = useState<
    "meetings" | "academic" | "financial"
  >("meetings");

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [academic, setAcademic] = useState<AcademicContribution[]>([]);
  const [financial, setFinancial] = useState<FinancialContribution[]>([]);

  const [meetingForm, setMeetingForm] = useState({
    activity_date: "",
    department: "",
    activity_name: "",
    alumni_present: "",
    proof_link: "",
  });

  const [academicForm, setAcademicForm] = useState({
    contribution_date: "",
    alumni_name: "",
    alumni_roll_number: "",
    contribution_type: "",
    contribution_details: "",
    students_benefited: "",
    proof_link: "",
  });

  const [financialForm, setFinancialForm] = useState({
    contribution_date: "",
    alumni_name: "",
    alumni_roll_number: "",
    amount: "",
    sponsored_for: "",
    proof_link: "",
  });

  const [loading, setLoading] = useState(false);

  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [editingAcademicId, setEditingAcademicId] = useState<string | null>(null);
  const [editingFinancialId, setEditingFinancialId] = useState<string | null>(null);

  const [meetingSearch, setMeetingSearch] = useState("");
  const [meetingDepartment, setMeetingDepartment] = useState("");
  const [meetingFromDate, setMeetingFromDate] = useState("");
  const [meetingToDate, setMeetingToDate] = useState("");

  const [academicSearch, setAcademicSearch] = useState("");
  const [academicType, setAcademicType] = useState("");

  const [financialSearch, setFinancialSearch] = useState("");
  const [financialFromDate, setFinancialFromDate] = useState("");
  const [financialToDate, setFinancialToDate] = useState("");

  async function loadData() {
    const [meetingsRes, academicRes, financialRes] = await Promise.all([
      supabase
        .from("alumni_meetings")
        .select("*")
        .order("activity_date", { ascending: false }),

      supabase
        .from("alumni_academic_contributions")
        .select("*")
        .order("contribution_date", { ascending: false }),

      supabase
        .from("alumni_financial_contributions")
        .select("*")
        .order("contribution_date", { ascending: false }),
    ]);

    if (meetingsRes.data) setMeetings(meetingsRes.data);
    if (academicRes.data) setAcademic(academicRes.data);
    if (financialRes.data) setFinancial(financialRes.data);
  }

  useEffect(() => {
    loadData();
  }, []);


  const filteredMeetings = meetings.filter((item) => {
    const search = meetingSearch.trim().toLowerCase();
    const matchesSearch =
      !search ||
      (item.department || "").toLowerCase().includes(search) ||
      (item.activity_name || "").toLowerCase().includes(search);
    const matchesDepartment =
      !meetingDepartment ||
      (item.department || "").toLowerCase() === meetingDepartment.toLowerCase();
    const matchesFromDate =
      !meetingFromDate ||
      (!!item.activity_date && item.activity_date >= meetingFromDate);
    const matchesToDate =
      !meetingToDate ||
      (!!item.activity_date && item.activity_date <= meetingToDate);

    return matchesSearch && matchesDepartment && matchesFromDate && matchesToDate;
  });

  const filteredAcademic = academic.filter((item) => {
    const search = academicSearch.trim().toLowerCase();
    const matchesSearch =
      !search ||
      (item.alumni_name || "").toLowerCase().includes(search) ||
      (item.alumni_roll_number || "").toLowerCase().includes(search) ||
      (item.contribution_details || "").toLowerCase().includes(search);
    const matchesType =
      !academicType || item.contribution_type === academicType;

    return matchesSearch && matchesType;
  });

  const filteredFinancial = financial.filter((item) => {
    const search = financialSearch.trim().toLowerCase();
    const matchesSearch =
      !search ||
      (item.alumni_name || "").toLowerCase().includes(search) ||
      (item.alumni_roll_number || "").toLowerCase().includes(search) ||
      (item.sponsored_for || "").toLowerCase().includes(search);
    const matchesFromDate =
      !financialFromDate ||
      (!!item.contribution_date && item.contribution_date >= financialFromDate);
    const matchesToDate =
      !financialToDate ||
      (!!item.contribution_date && item.contribution_date <= financialToDate);

    return matchesSearch && matchesFromDate && matchesToDate;
  });

  function clearCurrentFilters() {
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
      setFinancialFromDate("");
      setFinancialToDate("");
    }
  }

  function exportToExcel() {
    const workbook = XLSX.utils.book_new();

    const meetingsData = filteredMeetings.map((item) => ({
      Date: item.activity_date || "",
      Department: item.department || "",
      Activity: item.activity_name || "",
      "Alumni Present": item.alumni_present ?? "",
      "Proof Link": item.proof_link || "",
    }));

    const academicData = filteredAcademic.map((item) => ({
      Date: item.contribution_date || "",
      "Alumni Name": item.alumni_name || "",
      "Alumni Roll Number": item.alumni_roll_number || "",
      "Contribution Type": item.contribution_type || "",
      "Contribution Details": item.contribution_details || "",
      "Students Benefited": item.students_benefited ?? "",
      "Proof Link": item.proof_link || "",
    }));

    const financialData = filteredFinancial.map((item) => ({
      Date: item.contribution_date || "",
      "Alumni Name": item.alumni_name || "",
      "Alumni Roll Number": item.alumni_roll_number || "",
      Amount: item.amount ?? "",
      "Sponsored For": item.sponsored_for || "",
      "Proof Link": item.proof_link || "",
    }));

    const meetingsSheet = XLSX.utils.json_to_sheet(meetingsData);
    const academicSheet = XLSX.utils.json_to_sheet(academicData);
    const financialSheet = XLSX.utils.json_to_sheet(financialData);

    XLSX.utils.book_append_sheet(workbook, meetingsSheet, "Alumni Meetings");
    XLSX.utils.book_append_sheet(
      workbook,
      academicSheet,
      "Academic Contributions"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      financialSheet,
      "Financial Contributions"
    );

    XLSX.writeFile(workbook, "ANITS_Alumni_Contributions.xlsx");
  }

  function getPrintTitle() {
    if (activeTab === "meetings") return "ALUMNI MEETINGS";
    if (activeTab === "academic") return "ALUMNI ACADEMIC CONTRIBUTIONS";
    return "ALUMNI FINANCIAL CONTRIBUTIONS";
  }

  function handlePrint() {
    window.print();
  }


  async function addMeeting(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      activity_date: meetingForm.activity_date || null,
      department: meetingForm.department || null,
      activity_name: meetingForm.activity_name || null,
      alumni_present:
        meetingForm.alumni_present === ""
          ? null
          : Number(meetingForm.alumni_present),
      proof_link: meetingForm.proof_link || null,
    };

    const { error } = editingMeetingId
      ? await supabase
          .from("alumni_meetings")
          .update(payload)
          .eq("id", editingMeetingId)
      : await supabase.from("alumni_meetings").insert(payload);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setMeetingForm({
      activity_date: "",
      department: "",
      activity_name: "",
      alumni_present: "",
      proof_link: "",
    });

    setEditingMeetingId(null);
    loadData();
  }

  function editMeeting(item: Meeting) {
    setMeetingForm({
      activity_date: item.activity_date || "",
      department: item.department || "",
      activity_name: item.activity_name || "",
      alumni_present:
        item.alumni_present === null ? "" : String(item.alumni_present),
      proof_link: item.proof_link || "",
    });
    setEditingMeetingId(item.id);
    setActiveTab("meetings");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteMeeting(id: string) {
    if (!window.confirm("Delete this alumni meeting record?")) return;

    const { error } = await supabase
      .from("alumni_meetings")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadData();
  }

  function cancelMeetingEdit() {
    setMeetingForm({
      activity_date: "",
      department: "",
      activity_name: "",
      alumni_present: "",
      proof_link: "",
    });
    setEditingMeetingId(null);
  }

  async function addAcademic(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      contribution_date: academicForm.contribution_date || null,
      alumni_name: academicForm.alumni_name || null,
      alumni_roll_number: academicForm.alumni_roll_number || null,
      contribution_type: academicForm.contribution_type || null,
      contribution_details: academicForm.contribution_details || null,
      students_benefited:
        academicForm.students_benefited === ""
          ? null
          : Number(academicForm.students_benefited),
      proof_link: academicForm.proof_link || null,
    };

    const { error } = editingAcademicId
      ? await supabase
          .from("alumni_academic_contributions")
          .update(payload)
          .eq("id", editingAcademicId)
      : await supabase
          .from("alumni_academic_contributions")
          .insert(payload);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setAcademicForm({
      contribution_date: "",
      alumni_name: "",
      alumni_roll_number: "",
      contribution_type: "",
      contribution_details: "",
      students_benefited: "",
      proof_link: "",
    });

    setEditingAcademicId(null);
    loadData();
  }

  function editAcademic(item: AcademicContribution) {
    setAcademicForm({
      contribution_date: item.contribution_date || "",
      alumni_name: item.alumni_name || "",
      alumni_roll_number: item.alumni_roll_number || "",
      contribution_type: item.contribution_type || "",
      contribution_details: item.contribution_details || "",
      students_benefited:
        item.students_benefited === null
          ? ""
          : String(item.students_benefited),
      proof_link: item.proof_link || "",
    });
    setEditingAcademicId(item.id);
    setActiveTab("academic");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteAcademic(id: string) {
    if (!window.confirm("Delete this academic contribution record?")) return;

    const { error } = await supabase
      .from("alumni_academic_contributions")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadData();
  }

  function cancelAcademicEdit() {
    setAcademicForm({
      contribution_date: "",
      alumni_name: "",
      alumni_roll_number: "",
      contribution_type: "",
      contribution_details: "",
      students_benefited: "",
      proof_link: "",
    });
    setEditingAcademicId(null);
  }

  async function addFinancial(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      contribution_date: financialForm.contribution_date || null,
      alumni_name: financialForm.alumni_name || null,
      alumni_roll_number: financialForm.alumni_roll_number || null,
      amount:
        financialForm.amount === "" ? null : Number(financialForm.amount),
      sponsored_for: financialForm.sponsored_for || null,
      proof_link: financialForm.proof_link || null,
    };

    const { error } = editingFinancialId
      ? await supabase
          .from("alumni_financial_contributions")
          .update(payload)
          .eq("id", editingFinancialId)
      : await supabase
          .from("alumni_financial_contributions")
          .insert(payload);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setFinancialForm({
      contribution_date: "",
      alumni_name: "",
      alumni_roll_number: "",
      amount: "",
      sponsored_for: "",
      proof_link: "",
    });

    setEditingFinancialId(null);
    loadData();
  }

  function editFinancial(item: FinancialContribution) {
    setFinancialForm({
      contribution_date: item.contribution_date || "",
      alumni_name: item.alumni_name || "",
      alumni_roll_number: item.alumni_roll_number || "",
      amount: item.amount === null ? "" : String(item.amount),
      sponsored_for: item.sponsored_for || "",
      proof_link: item.proof_link || "",
    });
    setEditingFinancialId(item.id);
    setActiveTab("financial");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteFinancial(id: string) {
    if (!window.confirm("Delete this financial contribution record?")) return;

    const { error } = await supabase
      .from("alumni_financial_contributions")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadData();
  }

  function cancelFinancialEdit() {
    setFinancialForm({
      contribution_date: "",
      alumni_name: "",
      alumni_roll_number: "",
      amount: "",
      sponsored_for: "",
      proof_link: "",
    });
    setEditingFinancialId(null);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Alumni Contributions
            </h1>
            <p className="mt-1 text-gray-500">
              Manage alumni meetings, academic and financial contributions
            </p>
          </div>

          <a
            href="/admin"
            className="rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700"
          >
            Back to Admin
          </a>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 rounded-xl bg-white p-2 shadow-sm print:hidden">
          <button
            onClick={() => setActiveTab("meetings")}
            className={`rounded-lg px-5 py-2.5 font-semibold ${
              activeTab === "meetings"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Alumni Meetings
          </button>

          <button
            onClick={() => setActiveTab("academic")}
            className={`rounded-lg px-5 py-2.5 font-semibold ${
              activeTab === "academic"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Academic Contributions
          </button>

          <button
            onClick={() => setActiveTab("financial")}
            className={`rounded-lg px-5 py-2.5 font-semibold ${
              activeTab === "financial"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Financial Contributions
          </button>
        </div>

        {/* Print / Export Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm print:hidden">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {getPrintTitle()}
            </h2>
            <p className="text-sm text-gray-500">
              Search/filter, print, save as PDF, or export the selected records
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handlePrint}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Print Preview
            </button>

            <button
              onClick={handlePrint}
              className="rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-900"
            >
              Print
            </button>

            <button
              onClick={handlePrint}
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              Save as PDF
            </button>

            <button
              onClick={exportToExcel}
              className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
            >
              Export Excel
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm print:hidden">
          {activeTab === "meetings" && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              <input
                type="text"
                placeholder="Search activity / department"
                value={meetingSearch}
                onChange={(e) => setMeetingSearch(e.target.value)}
                className="rounded-lg border p-3"
              />
              <select
                value={meetingDepartment}
                onChange={(e) => setMeetingDepartment(e.target.value)}
                className="rounded-lg border p-3"
              >
                <option value="">All Departments</option>
                {Array.from(
                  new Set(
                    meetings
                      .map((item) => item.department)
                      .filter(Boolean) as string[]
                  )
                )
                  .sort()
                  .map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
              </select>
              <input
                type="date"
                value={meetingFromDate}
                onChange={(e) => setMeetingFromDate(e.target.value)}
                className="rounded-lg border p-3"
                title="From date"
              />
              <input
                type="date"
                value={meetingToDate}
                onChange={(e) => setMeetingToDate(e.target.value)}
                className="rounded-lg border p-3"
                title="To date"
              />
              <button
                type="button"
                onClick={clearCurrentFilters}
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
                className="rounded-lg border p-3"
              />
              <select
                value={academicType}
                onChange={(e) => setAcademicType(e.target.value)}
                className="rounded-lg border p-3"
              >
                <option value="">All Contribution Types</option>
                <option value="Guest Lecture">Guest Lecture</option>
                <option value="Technical Talk">Technical Talk</option>
                <option value="Workshop">Workshop</option>
                <option value="Mentoring">Mentoring</option>
                <option value="Project Guidance">Project Guidance</option>
                <option value="Internship Support">Internship Support</option>
                <option value="Placement Support">Placement Support</option>
                <option value="Other">Other</option>
              </select>
              <button
                type="button"
                onClick={clearCurrentFilters}
                className="rounded-lg bg-gray-600 px-4 py-3 font-semibold text-white hover:bg-gray-700"
              >
                Clear Filters
              </button>
            </div>
          )}

          {activeTab === "financial" && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <input
                type="text"
                placeholder="Search name / roll number / sponsored for"
                value={financialSearch}
                onChange={(e) => setFinancialSearch(e.target.value)}
                className="rounded-lg border p-3 lg:col-span-2"
              />
              <input
                type="date"
                value={financialFromDate}
                onChange={(e) => setFinancialFromDate(e.target.value)}
                className="rounded-lg border p-3"
                title="From date"
              />
              <input
                type="date"
                value={financialToDate}
                onChange={(e) => setFinancialToDate(e.target.value)}
                className="rounded-lg border p-3"
                title="To date"
              />
              <button
                type="button"
                onClick={clearCurrentFilters}
                className="rounded-lg bg-gray-600 px-4 py-3 font-semibold text-white hover:bg-gray-700"
              >
                Clear Filters
              </button>
            </div>
          )}

          <div className="mt-3 text-sm font-medium text-gray-500">
            Showing{" "}
            {activeTab === "meetings"
              ? filteredMeetings.length
              : activeTab === "academic"
              ? filteredAcademic.length
              : filteredFinancial.length}{" "}
            record(s)
          </div>
        </div>

        {/* Print-only ANITS Letterhead */}
        <div className="hidden print:block print-letterhead">
          <img
            src="/anits_letterhead.png"
            alt="ANITS Department of Mechanical Engineering Letterhead"
            className="w-full"
          />
        </div>

        {/* Alumni Meetings */}
        {activeTab === "meetings" && (
          <section className="space-y-6">

            <form
              onSubmit={addMeeting}
              className="rounded-xl bg-white p-6 shadow-sm print:hidden"
            >
              <h2 className="mb-5 text-xl font-bold text-gray-800">
                {editingMeetingId
                  ? "Edit Alumni Meeting / Activity"
                  : "Add Alumni Meeting / Activity"}
              </h2>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                <input
                  type="date"
                  value={meetingForm.activity_date}
                  onChange={(e) =>
                    setMeetingForm({
                      ...meetingForm,
                      activity_date: e.target.value,
                    })
                  }
                  className="rounded-lg border p-3"
                />

                <input
                  type="text"
                  placeholder="Department"
                  value={meetingForm.department}
                  onChange={(e) =>
                    setMeetingForm({
                      ...meetingForm,
                      department: e.target.value,
                    })
                  }
                  className="rounded-lg border p-3"
                />

                <input
                  type="text"
                  placeholder="Activity / Meeting Name"
                  value={meetingForm.activity_name}
                  onChange={(e) =>
                    setMeetingForm({
                      ...meetingForm,
                      activity_name: e.target.value,
                    })
                  }
                  className="rounded-lg border p-3"
                />

                <input
                  type="number"
                  placeholder="Alumni Present"
                  value={meetingForm.alumni_present}
                  onChange={(e) =>
                    setMeetingForm({
                      ...meetingForm,
                      alumni_present: e.target.value,
                    })
                  }
                  className="rounded-lg border p-3"
                />

                <input
                  type="text"
                  placeholder="Google Drive Proof Link"
                  value={meetingForm.proof_link}
                  onChange={(e) =>
                    setMeetingForm({
                      ...meetingForm,
                      proof_link: e.target.value,
                    })
                  }
                  className="rounded-lg border p-3"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-5 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
              >
                {loading
                  ? "Saving..."
                  : editingMeetingId
                  ? "Update Meeting"
                  : "Add Meeting"}
              </button>

              {editingMeetingId && (
                <button
                  type="button"
                  onClick={cancelMeetingEdit}
                  className="ml-3 rounded-lg bg-gray-500 px-6 py-3 font-semibold text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </form>

            <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Activity</th>
                    <th className="p-4">Alumni Present</th>
                    <th className="p-4">Proof</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMeetings.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-4">{item.activity_date || "-"}</td>
                      <td className="p-4">{item.department || "-"}</td>
                      <td className="p-4">{item.activity_name || "-"}</td>
                      <td className="p-4">
                        {item.alumni_present ?? "-"}
                      </td>
                      <td className="p-4">
                        {item.proof_link ? (
                          <a href={item.proof_link} target="_blank" rel="noopener noreferrer"
                            className="font-semibold text-blue-600 hover:underline">
                            View Proof
                          </a>
                        ) : "-"}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {item.proof_link && (
                          <a
                            href={item.proof_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mr-2 rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
                          >
                            View Proof
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            editMeeting(item);
                          }}
                          className="mr-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            deleteMeeting(item.id);
                          }}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </section>
        )}

        {/* Academic Contributions */}
        {activeTab === "academic" && (
          <section className="space-y-6">

            <form
              onSubmit={addAcademic}
              className="rounded-xl bg-white p-6 shadow-sm print:hidden"
            >
              <h2 className="mb-5 text-xl font-bold text-gray-800">
                {editingAcademicId
                  ? "Edit Academic Contribution"
                  : "Add Academic Contribution"}
              </h2>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                <input
                  type="date"
                  value={academicForm.contribution_date}
                  onChange={(e) =>
                    setAcademicForm({
                      ...academicForm,
                      contribution_date: e.target.value,
                    })
                  }
                  className="rounded-lg border p-3"
                />

                <input
                  type="text"
                  placeholder="Alumni Name"
                  value={academicForm.alumni_name}
                  onChange={(e) =>
                    setAcademicForm({
                      ...academicForm,
                      alumni_name: e.target.value,
                    })
                  }
                  className="rounded-lg border p-3"
                />

                <input
                  type="text"
                  placeholder="Alumni Roll Number"
                  value={academicForm.alumni_roll_number}
                  onChange={(e) =>
                    setAcademicForm({
                      ...academicForm,
                      alumni_roll_number: e.target.value,
                    })
                  }
                  className="rounded-lg border p-3"
                />

                <select
                  value={academicForm.contribution_type}
                  onChange={(e) =>
                    setAcademicForm({
                      ...academicForm,
                      contribution_type: e.target.value,
                    })
                  }
                  className="rounded-lg border p-3"
                >
                  <option value="">Contribution Type</option>
                  <option value="Guest Lecture">Guest Lecture</option>
                  <option value="Technical Talk">Technical Talk</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Mentoring">Mentoring</option>
                  <option value="Project Guidance">
                    Project Guidance
                  </option>
                  <option value="Internship Support">
                    Internship Support
                  </option>
                  <option value="Placement Support">
                    Placement Support
                  </option>
                  <option value="Other">Other</option>
                </select>

                <input
                  type="text"
                  placeholder="Students Benefited"
                  value={academicForm.students_benefited}
                  onChange={(e) =>
                    setAcademicForm({
                      ...academicForm,
                      students_benefited: e.target.value,
                    })
                  }
                  className="rounded-lg border p-3"
                />

                <input
                  type="text"
                  placeholder="Contribution Details"
                  value={academicForm.contribution_details}
                  onChange={(e) =>
                    setAcademicForm({
                      ...academicForm,
                      contribution_details: e.target.value,
                    })
                  }
                  className="rounded-lg border p-3 md:col-span-2 lg:col-span-3"
                />

                <input
                  type="text"
                  placeholder="Google Drive Proof Link"
                  value={academicForm.proof_link}
                  onChange={(e) =>
                    setAcademicForm({
                      ...academicForm,
                      proof_link: e.target.value,
                    })
                  }
                  className="rounded-lg border p-3"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-5 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
              >
                {loading
                  ? "Saving..."
                  : editingAcademicId
                  ? "Update Contribution"
                  : "Add Contribution"}
              </button>

              {editingAcademicId && (
                <button
                  type="button"
                  onClick={cancelAcademicEdit}
                  className="ml-3 rounded-lg bg-gray-500 px-6 py-3 font-semibold text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </form>

            <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Alumni Name</th>
                    <th className="p-4">Roll Number</th>
                    <th className="p-4">Contribution Type</th>
                    <th className="p-4">Details</th>
                    <th className="p-4">Students Benefited</th>
                    <th className="p-4">Proof</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAcademic.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-4">
                        {item.contribution_date || "-"}
                      </td>
                      <td className="p-4">{item.alumni_name || "-"}</td>
                      <td className="p-4">
                        {item.alumni_roll_number || "-"}
                      </td>
                      <td className="p-4">
                        {item.contribution_type || "-"}
                      </td>
                      <td className="p-4">
                        {item.contribution_details || "-"}
                      </td>
                      <td className="p-4">
                        {item.students_benefited ?? "-"}
                      </td>
                      <td className="p-4">
                        {item.proof_link ? (
                          <a href={item.proof_link} target="_blank" rel="noopener noreferrer"
                            className="font-semibold text-blue-600 hover:underline">
                            View Proof
                          </a>
                        ) : "-"}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {item.proof_link && (
                          <a
                            href={item.proof_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mr-2 rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
                          >
                            View Proof
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            editAcademic(item);
                          }}
                          className="mr-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            deleteAcademic(item.id);
                          }}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </section>
        )}

        {/* Financial Contributions */}
        {activeTab === "financial" && (
          <section className="space-y-6">

            <form
              onSubmit={addFinancial}
              className="rounded-xl bg-white p-6 shadow-sm print:hidden"
            >
              <h2 className="mb-5 text-xl font-bold text-gray-800">
                {editingFinancialId
                  ? "Edit Financial Contribution"
                  : "Add Financial Contribution"}
              </h2>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                <input
                  type="date"
                  value={financialForm.contribution_date}
                  onChange={(e) =>
                    setFinancialForm({
                      ...financialForm,
                      contribution_date: e.target.value,
                    })
                  }
                  className="rounded-lg border p-3"
                />

                <input
                  type="text"
                  placeholder="Alumni Name"
                  value={financialForm.alumni_name}
                  onChange={(e) =>
                    setFinancialForm({
                      ...financialForm,
                      alumni_name: e.target.value,
                    })
                  }
                  className="rounded-lg border p-3"
                />

                <input
                  type="text"
                  placeholder="Alumni Roll Number"
                  value={financialForm.alumni_roll_number}
                  onChange={(e) =>
                    setFinancialForm({
                      ...financialForm,
                      alumni_roll_number: e.target.value,
                    })
                  }
                  className="rounded-lg border p-3"
                />

                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={financialForm.amount}
                  onChange={(e) =>
                    setFinancialForm({
                      ...financialForm,
                      amount: e.target.value,
                    })
                  }
                  className="rounded-lg border p-3"
                />

                <input
                  type="text"
                  placeholder="Sponsored For"
                  value={financialForm.sponsored_for}
                  onChange={(e) =>
                    setFinancialForm({
                      ...financialForm,
                      sponsored_for: e.target.value,
                    })
                  }
                  className="rounded-lg border p-3"
                />

                <input
                  type="text"
                  placeholder="Google Drive Proof Link"
                  value={financialForm.proof_link}
                  onChange={(e) =>
                    setFinancialForm({
                      ...financialForm,
                      proof_link: e.target.value,
                    })
                  }
                  className="rounded-lg border p-3"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-5 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
              >
                {loading
                  ? "Saving..."
                  : editingFinancialId
                  ? "Update Contribution"
                  : "Add Contribution"}
              </button>

              {editingFinancialId && (
                <button
                  type="button"
                  onClick={cancelFinancialEdit}
                  className="ml-3 rounded-lg bg-gray-500 px-6 py-3 font-semibold text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </form>

            <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Alumni Name</th>
                    <th className="p-4">Roll Number</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Sponsored For</th>
                    <th className="p-4">Proof</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredFinancial.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-4">
                        {item.contribution_date || "-"}
                      </td>
                      <td className="p-4">{item.alumni_name || "-"}</td>
                      <td className="p-4">
                        {item.alumni_roll_number || "-"}
                      </td>
                      <td className="p-4">
                        {item.amount ?? "-"}
                      </td>
                      <td className="p-4">
                        {item.sponsored_for || "-"}
                      </td>
                      <td className="p-4">
                        {item.proof_link ? (
                          <a href={item.proof_link} target="_blank" rel="noopener noreferrer"
                            className="font-semibold text-blue-600 hover:underline">
                            View Proof
                          </a>
                        ) : "-"}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {item.proof_link && (
                          <a
                            href={item.proof_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mr-2 rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
                          >
                            View Proof
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            editFinancial(item);
                          }}
                          className="mr-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            deleteFinancial(item.id);
                          }}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </section>
        )}

        {/* Print styles */}
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

            form,
            .shadow-sm {
              box-shadow: none !important;
            }

            section {
              margin: 0 !important;
            }

            section > div.overflow-x-auto {
              margin: 0 !important;
              border-radius: 0 !important;
              overflow: visible !important;
            }
          }
        `}</style>

      </div>
    </main>
  );
}