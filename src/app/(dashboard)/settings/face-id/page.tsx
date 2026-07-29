import FaceIdClient from "./FaceIdClient";
import { getCurrentUser } from "@/actions/auth";
import { redirect } from "next/navigation";

export default async function FaceIdEnrollmentPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <FaceIdClient userId={user.id} />;
}
