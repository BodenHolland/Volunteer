import { StatusPage } from "@/components/status-page";

export const metadata = { title: "Not allowed — Tended" };

export default function UnauthorizedPage() {
  return (
    <StatusPage
      code="403"
      title="You don't have access to that"
      body="This area is for a different kind of account. Switch identity to continue as the right user."
      primary={{ href: "/start", label: "Switch identity" }}
      secondary={{ href: "/", label: "Back to home" }}
    />
  );
}
