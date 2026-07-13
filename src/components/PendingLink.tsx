"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ComponentProps, MouseEvent, ReactNode } from "react";

type PendingLinkProps = ComponentProps<typeof Link> & {
  children: ReactNode;
  loadingLabel?: string;
  pendingClassName?: string;
};

export function PendingLink({
  children,
  className = "",
  href,
  loadingLabel,
  onClick,
  pendingClassName = "opacity-90",
  target,
  ...props
}: PendingLinkProps) {
  const pathname = usePathname();
  const [isPending, setIsPending] = useState(false);
  const hrefValue = typeof href === "string" ? href : href.pathname || "";

  useEffect(() => {
    setIsPending(false);
  }, [pathname]);

  useEffect(() => {
    if (!isPending) return;

    const timeout = window.setTimeout(() => {
      setIsPending(false);
    }, 8000);

    return () => window.clearTimeout(timeout);
  }, [isPending]);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      (target && target !== "_self") ||
      hrefValue.startsWith("#") ||
      hrefValue === pathname
    ) {
      return;
    }

    setIsPending(true);
  };

  return (
    <Link
      {...props}
      href={href}
      target={target}
      onClick={handleClick}
      aria-busy={isPending || undefined}
      className={`${className} ${isPending ? pendingClassName : ""}`.trim()}
    >
      <div className="inline-flex min-w-0 items-center justify-center gap-2">
        {isPending && (
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        {isPending && loadingLabel ? loadingLabel : children}
      </div>
    </Link>
  );
}
