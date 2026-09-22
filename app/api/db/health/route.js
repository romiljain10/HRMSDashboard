import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth";
import { getDb } from "@/lib/db/mongodb";
import { ensureIndexes } from "@/lib/db/collections";

export async function GET() {
  const cookieStore = await cookies();
  const session = await verifySession(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!session || session.role !== "Admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const db = await getDb();
    // A lightweight command that confirms the connection actually works,
    // not just that the client object exists.
    await db.command({ ping: 1 });

    const indexResult = await ensureIndexes();
    const collections = await db.listCollections().toArray();

    return NextResponse.json({
      connected: true,
      database: db.databaseName,
      indexesEnsured: indexResult.ok,
      collections: collections.map((c) => c.name),
    });
  } catch (err) {
    return NextResponse.json(
      { connected: false, error: err.message },
      { status: 500 }
    );
  }
}
