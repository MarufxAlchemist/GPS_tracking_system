import { createFileRoute } from "@tanstack/react-router";
import { Auth } from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create Account — GeoFence" }, { name: "description", content: "Join GeoFence and start your 14-day free trial." }] }),
  component: SignupPage,
});

function SignupPage() {
  return <Auth mode="signup" />;
}
