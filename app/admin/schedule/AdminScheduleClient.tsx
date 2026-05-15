"use client";

import { useState } from "react";
import TimetableManager from "@/components/admin/TimetableManager";
import ShowTemplateManager from "@/components/admin/ShowTemplateManager";

const TABS = [
  { id: "timetable",  label: "Timetable" },
  { id: "recurring",  label: "Recurring Templates" },
] as const;

type Tab = typeof TABS[number]["id"];

export default function AdminScheduleClient() {
  const [tab, setTab] = useState<Tab>("timetable");

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-title">Schedule</div>
        <div className="admin-page-sub">Manage the live broadcast timetable and recurring show templates.</div>
      </div>

      <div className="admin-tabs">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            className={`admin-tab${tab === id ? " admin-tab--active" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "timetable"  && <TimetableManager />}
      {tab === "recurring"  && <ShowTemplateManager />}
    </div>
  );
}
