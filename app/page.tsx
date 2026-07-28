import { redirect } from "next/navigation";

// The landing page belongs here and is being built next; until then the root
// hands straight over to the tool rather than showing a hole.
export default function Home() {
  redirect("/ask");
}
