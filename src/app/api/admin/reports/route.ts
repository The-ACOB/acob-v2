import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";

function toCsv(rows: string[][]) {
  return rows
    .map((row) =>
      row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","),
    )
    .join("\r\n");
}
export async function GET(request: Request) {
  try {
    await requireRole("CEO");
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
  const type = new URL(request.url).searchParams.get("type");
  let rows: string[][];
  if (type === "participants") {
    const data = await db.participant.findMany({
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: "desc" },
    });
    rows = [
      [
        "Participant ID",
        "Name",
        "Email",
        "Phone",
        "Gender",
        "Institution",
        "Class/Grade",
        "Academic level",
        "District",
        "Registration date",
      ],
      ...data.map((p) => [
        p.id,
        p.user.profile?.fullName ?? "",
        p.user.email,
        p.user.profile?.phone ?? "",
        p.gender ?? "",
        p.institution ?? "",
        p.gradeLevel ?? "",
        p.academicLevel ?? "",
        p.district ?? "",
        p.createdAt.toISOString(),
      ]),
    ];
  } else if (type === "users") {
    const data = await db.user.findMany({
      include: { profile: true, userRoles: { include: { role: true } } },
      orderBy: { createdAt: "desc" },
    });
    rows = [
      ["User ID", "Name", "Email", "Role", "Created date"],
      ...data.flatMap((u) =>
        u.userRoles.map((r) => [
          u.id,
          u.profile?.fullName ?? "",
          u.email,
          r.role.key,
          u.createdAt.toISOString(),
        ]),
      ),
    ];
  } else if (type === "olympiads") {
    const data = await db.olympiad.findMany({
      include: { _count: { select: { registrations: true, attempts: true } } },
      orderBy: { createdAt: "desc" },
    });
    rows = [
      [
        "Olympiad",
        "Status",
        "Registration count",
        "Attempt count",
        "Completion count",
      ],
      ...data.map((o) => [
        o.title,
        o.status,
        String(o._count.registrations),
        String(o._count.attempts),
        String(o._count.attempts),
      ]),
    ];
  } else if (type === "summary") {
    const [
      users,
      participants,
      ambassadors,
      olympiads,
      registrations,
      attempts,
      certificates,
      letters,
    ] = await Promise.all([
      db.user.count(),
      db.participant.count(),
      db.ambassador.count(),
      db.olympiad.count(),
      db.olympiadRegistration.count(),
      db.attempt.count(),
      db.certificate.count(),
      db.recommendationLetter.count(),
    ]);
    rows = [
      ["Metric", "Value"],
      ["Users", String(users)],
      ["Participants", String(participants)],
      ["Ambassadors", String(ambassadors)],
      ["Olympiads", String(olympiads)],
      ["Registrations", String(registrations)],
      ["Attempts", String(attempts)],
      ["Certificates", String(certificates)],
      ["Recommendation letters", String(letters)],
    ];
  } else
    return NextResponse.json(
      { error: "Unknown report type." },
      { status: 400 },
    );
  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="acob-${type}.csv"`,
    },
  });
}
