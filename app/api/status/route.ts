import { connection } from "next/server";
import { json } from "@/lib/api";
import { getKioskStatus } from "@/lib/hours";

export async function GET() {
  await connection(); // always answer per request, never from a build-time copy
  return json(getKioskStatus());
}
