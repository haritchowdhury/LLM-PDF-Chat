import { auth } from "@/lib/auth";

export default async function getUserSession() {
  const session: any = await auth();
  if (!session.user?.id) return;
  return [`${session.user.id}_session`, `${session.user.id}_documents`];
}
