import { createFileRoute } from "@tanstack/react-router";
import { Auth } from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — GeoFence" }, { name: "description", content: "Start your GeoFence trial." }] }),
  component: () => <Auth mode="signup" />,
});
