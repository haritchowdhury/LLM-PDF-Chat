"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { InlineSpinner } from "@/components/loading/LoadingPrimitives";
import { Button } from "@/components/ui/button";

type AuthSubmitButtonProps = {
  children: ReactNode;
  pendingLabel: string;
};

export function AuthSubmitButton({
  children,
  pendingLabel,
}: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      aria-busy={pending || undefined}
      className="w-full"
      disabled={pending}
      type="submit"
      variant="outline"
    >
      {pending ? (
        <>
          <InlineSpinner />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
