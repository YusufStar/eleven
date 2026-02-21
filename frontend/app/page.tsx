import { Suspense } from "react";
import { PaymentResultModal } from "@/components/payment";

export default function Page() {
    return (
        <div className="flex min-h-svh items-center justify-center">
            home
            <Suspense fallback={null}>
                <PaymentResultModal />
            </Suspense>
        </div>
    );
}