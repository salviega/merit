import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/Skeleton";
import { privatePageRobots } from "../metadata";
import { LendingView } from "./LendingView";

export const metadata: Metadata = {
  title: "Aportar liquidez",
  description: "Autoriza un cupo desde tu wallet. El dinero no sale hasta que se presta.",
  robots: privatePageRobots,
};

export default function LendingPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6">
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <LendingView />
      </Suspense>
    </main>
  );
}
