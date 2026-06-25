import { StatusPage } from "@/components/status-page";

export const metadata = { title: "Not found — colift" };

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="Page not found"
      body="That page doesn't exist or may have moved."
      primary={{ href: "/", label: "Back to home" }}
      secondary={{ href: "/app/tasks", label: "Browse tasks" }}
    />
  );
}
