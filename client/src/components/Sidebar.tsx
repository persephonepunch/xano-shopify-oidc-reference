import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { documentation, type DocSection } from "@/data/documentation";
import { Search } from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  activeSection: string;
  onSectionClick: (id: string) => void;
}

export default function Sidebar({ activeSection, onSectionClick }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filterSections = (sections: DocSection[], query: string): DocSection[] => {
    if (!query) return sections;
    
    return sections.filter(section => {
      const matchesTitle = section.title.toLowerCase().includes(query.toLowerCase());
      const matchesContent = section.content.toLowerCase().includes(query.toLowerCase());
      const hasMatchingSubsections = section.subsections?.some(sub => 
        sub.title.toLowerCase().includes(query.toLowerCase()) ||
        sub.content.toLowerCase().includes(query.toLowerCase())
      );
      
      return matchesTitle || matchesContent || hasMatchingSubsections;
    });
  };

  const filteredDocs = filterSections(documentation, searchQuery);

  const renderNavItem = (section: DocSection, level: number = 0) => {
    const isActive = activeSection === section.id;
    const paddingLeft = level * 16 + 16;
    
    return (
      <div key={section.id}>
        <button
          onClick={() => onSectionClick(section.id)}
          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
            isActive 
              ? 'bg-primary text-primary-foreground font-semibold' 
              : 'hover:bg-accent hover:text-accent-foreground'
          }`}
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          {section.title}
        </button>
        {section.subsections?.map(sub => renderNavItem(sub, level + 1))}
      </div>
    );
  };

  return (
    <div className="w-80 border-r border-border bg-sidebar flex flex-col h-full">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold mb-1">Xano-Shopify OIDC</h1>
        <p className="text-sm text-muted-foreground">Integration Reference</p>
      </div>
      
      <div className="p-4 border-b border-sidebar-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <nav className="py-2">
          {filteredDocs.length > 0 ? (
            filteredDocs.map(section => renderNavItem(section))
          ) : (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results found
            </div>
          )}
        </nav>
      </ScrollArea>
      
      <div className="p-4 border-t border-sidebar-border text-xs text-muted-foreground">
        <p>Last updated: February 10, 2026</p>
        <p className="mt-1">Author: Manus AI</p>
      </div>
    </div>
  );
}
