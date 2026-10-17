import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/Skeleton";
import { privatePageRobots } from "../metadata";
import { BorrowingView } from "./BorrowingView";

export const metadata: Metadata = {
  title: "Pedir préstamo",
  description:
    "Vincula tu wallet, recibe tu score merit y un cupo. El dinero llega de inmediato y se paga solo con un porcentaje de cada ingreso.",
  robots: privatePageRobots,
};

export default function BorrowingPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6">
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <BorrowingView />
      </Suspense>
    </main>
  );
}
