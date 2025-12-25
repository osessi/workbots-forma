import { cn } from "@/lib/slides/utils";
import { ReactNode } from "react";

interface WrapperProps {
    children: ReactNode;
    className?: string;
}

export default function Wrapper({ children, className }: WrapperProps) {
    return <div className={cn(`max-w-[1440px] w-[95%]  mx-auto `, className)}>{children}</div>;
}
