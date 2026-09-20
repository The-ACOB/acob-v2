"use client";

import { FileSpreadsheet, Printer } from "lucide-react";

type ExportRow = {
  fullName: string | null;
  email: string;
  roles: string[];
  institution: string | null;
  gradeLevel: string | null;
};

export function ParticipantExportToolbar({ rows }: { rows: ExportRow[] }) {
  const exportToCSV = () => {
    const headers = ["Full Name", "Email", "Roles", "Institution", "Grade"];
    const csvRows = rows.map((r) => [
      `"${r.fullName ?? ""}"`,
      `"${r.email}"`,
      `"${r.roles.join(", ")}"`,
      `"${r.institution ?? ""}"`,
      `"${r.gradeLevel ?? ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...csvRows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `acob_participants_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    // Create a hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ACOB Participants Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #111; }
            h2 { margin: 0 0 4px 0; font-size: 20px; font-weight: bold; }
            p { color: #666; font-size: 12px; margin: 0 0 20px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px 14px; text-align: left; }
            th { background-color: #f8fafc; font-weight: 600; color: #334155; }
            tr:nth-child(even) { background-color: #fcfcfc; }
          </style>
        </head>
        <body>
          <h2>ACOB Participants Report</h2>
          <p>Generated on ${new Date().toLocaleDateString()} — Total Filtered Records: ${rows.length}</p>
          <table>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Institution</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              ${
                rows.length === 0
                  ? `<tr><td colspan="5" style="text-align: center; color: #888;">No participants found.</td></tr>`
                  : rows
                      .map(
                        (r) => `
                <tr>
                  <td>${r.fullName ?? "—"}</td>
                  <td>${r.email}</td>
                  <td>${r.roles.join(", ")}</td>
                  <td>${r.institution ?? "—"}</td>
                  <td>${r.gradeLevel ?? "—"}</td>
                </tr>
              `,
                      )
                      .join("")
              }
            </tbody>
          </table>
        </body>
      </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    }, 250);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={exportToCSV}
        disabled={rows.length === 0}
        className="inline-flex items-center gap-1.5 rounded-md border border-border-strong bg-elevated px-3 py-2 text-xs font-medium text-primary transition-colors hover:border-accent disabled:opacity-50"
        title="Download filtered records as Excel CSV"
      >
        <FileSpreadsheet className="h-3.5 w-3.5 text-accent" />
        Export CSV
      </button>
      <button
        type="button"
        onClick={handlePrintPDF}
        disabled={rows.length === 0}
        className="inline-flex items-center gap-1.5 rounded-md border border-border-strong bg-elevated px-3 py-2 text-xs font-medium text-primary transition-colors hover:border-accent disabled:opacity-50"
        title="Print or save filtered view as PDF"
      >
        <Printer className="h-3.5 w-3.5 text-accent" />
        Print PDF
      </button>
    </div>
  );
}
