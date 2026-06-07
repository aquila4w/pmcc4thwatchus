import { redirect } from "next/navigation";

// Dedicated short URL for HFGC NY event
// Redirects to the registration page via the existing platform invite system
export default function HFGCNYPage() {
  // The platform invite code for this event — relative redirect works on any domain
  redirect("/p/SC9AV6XV");
}
