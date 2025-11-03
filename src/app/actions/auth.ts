"use server";

import { signIn } from "@/lib/auth";

export async function handleGoogleSignIn(callbackUrl: string) {
  await signIn("google", { callbackUrl, redirect: true });
}
