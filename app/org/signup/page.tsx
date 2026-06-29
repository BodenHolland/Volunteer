import { redirect } from "next/navigation";

// The org self-signup flow is replaced by a lightweight access-request page while
// Colift onboards partner organizations individually. Any existing "become a
// partner" link lands here and is forwarded to the request form.
export default function OrgSignupPage() {
  redirect("/request-access");
}
