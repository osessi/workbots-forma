'use client'
import React, { Suspense } from "react";

import { Button } from "@/components/slides/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import PdfMakerPage from "./PdfMakerPage";

function PdfMakerPageContent() {
    const router = useRouter();
    const params = useSearchParams();
    const queryId = params.get("id");
    if (!queryId) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <h1 className="text-2xl font-bold">No presentation id found</h1>
                <p className="text-gray-500 pb-4">Please try again</p>
                <Button onClick={() => router.push("/admin/slides/dashboard")}>Go to home</Button>
            </div>
        );
    }
    return (
        <PdfMakerPage presentation_id={queryId} />
    );
}

export default function Page() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div></div>}>
            <PdfMakerPageContent />
        </Suspense>
    );
}
