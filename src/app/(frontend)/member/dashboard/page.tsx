import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ADMIN_ROLES = [
  "superAdmin",
  "districtCoordinator",
  "subDistrictCoordinator",
  "headMinister",
  "secretary",
  "eventAdmin",
];

export default async function MemberDashboardPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string | undefined;

  if (role && ADMIN_ROLES.includes(role)) {
    redirect("/admin");
  }

  redirect("/home");
}
