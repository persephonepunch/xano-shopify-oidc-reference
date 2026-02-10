import ContentDisplay from "@/components/ContentDisplay";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

export default function Home() {
  const [activeSection, setActiveSection] = useState("executive-summary");

  const handleSectionClick = (id: string) => {
    setActiveSection(id);
    // Scroll to top of content area
    const contentArea = document.getElementById("content-area");
    if (contentArea) {
      contentArea.scrollTop = 0;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeSection={activeSection} onSectionClick={handleSectionClick} />
        
        <ScrollArea id="content-area" className="flex-1">
          <main className="container py-12">
            <ContentDisplay sectionId={activeSection} />
          </main>
        </ScrollArea>
      </div>
    </div>
  );
}
