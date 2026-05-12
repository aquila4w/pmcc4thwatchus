import { getPayload } from "payload";
import config from "@payload-config";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import type { NextRequest } from "next/server";

const ADMIN_ROLES = [
  "superAdmin",
  "districtCoordinator",
  "subDistrictCoordinator",
  "eventAdmin",
  "headMinister",
  "secretary",
];

const ELEVATED_ROLES = [
  "superAdmin",
  "districtCoordinator",
  "subDistrictCoordinator",
  "eventAdmin",
];

export async function getCurrentUser(request: NextRequest) {
  let user = null;

  const token = request.cookies.get("payload-token")?.value;
  if (token) {
    const headersList = await headers();
    const payload = await getPayload({ config });
    const authResult = await payload.auth({ headers: headersList });
    user = authResult.user;
  }

  if (!user) {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const payload = await getPayload({ config });
      user = await payload.findByID({
        collection: "users",
        id: session.user.id,
      });
    }
  }

  return user;
}

export function isAdmin(role: string | undefined): boolean {
  return ADMIN_ROLES.includes(role || "");
}

export function isElevatedRole(role: string | undefined): boolean {
  return ELEVATED_ROLES.includes(role || "");
}
