"use client";

import Wrapper from "@/components/slides/Wrapper";
import React from "react";
import Link from "next/link";
import BackBtn from "@/components/slides/BackBtn";
import { usePathname } from "next/navigation";
import HeaderNav from "@/app/(super-admin)/admin/slides/components/HeaderNab";
import { Layout, FilePlus2 } from "lucide-react";
import { trackEvent, MixpanelEvent } from "@/utils/slides/mixpanel";
const Header = () => {
  const pathname = usePathname();
  return (
    <div className="bg-gray-900 w-full shadow-lg sticky top-0 z-50">
      <Wrapper>
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3">
            {(pathname !== "/upload" && pathname !== "/dashboard") && <BackBtn />}
            <Link href="/admin/slides/dashboard" onClick={() => trackEvent(MixpanelEvent.Navigation, { from: pathname, to: "/dashboard" })} className="flex items-center gap-2">
              <img
                src="/logo-workbots-slides-white.svg"
                alt="Workbots Slides logo"
                className="h-12"
              />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/slides/custom-template"
              prefetch={false}
              onClick={() => trackEvent(MixpanelEvent.Navigation, { from: pathname, to: "/custom-template" })}
              className="flex items-center gap-2 px-3 py-2 text-white hover:bg-gray-700 rounded-md transition-colors outline-none"
              role="menuitem"
            >
              <FilePlus2 className="w-5 h-5" />
              <span className="text-sm font-medium font-inter">Create Template</span>
            </Link>
            <Link
              href="/admin/slides/template-preview"
              prefetch={false}
              onClick={() => trackEvent(MixpanelEvent.Navigation, { from: pathname, to: "/template-preview" })}
              className="flex items-center gap-2 px-3 py-2 text-white hover:bg-gray-700 rounded-md transition-colors outline-none"
              role="menuitem"
            >
              <Layout className="w-5 h-5" />
              <span className="text-sm font-medium font-inter">Templates</span>
            </Link>
            <HeaderNav />
          </div>
        </div>
      </Wrapper>
    </div>
  );
};

export default Header;
