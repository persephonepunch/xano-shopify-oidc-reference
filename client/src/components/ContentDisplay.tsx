import Breadcrumb from "@/components/Breadcrumb";
import { documentation, type DocSection } from "@/data/documentation";
import { useEffect } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

interface ContentDisplayProps {
  sectionId: string;
}

export default function ContentDisplay({ sectionId }: ContentDisplayProps) {

  const findSection = (sections: DocSection[], id: string): DocSection | null => {
    for (const section of sections) {
      if (section.id === id) return section;
      if (section.subsections) {
        const found = findSection(section.subsections, id);
        if (found) return found;
      }
    }
    return null;
  };

  const section = findSection(documentation, sectionId);

  useEffect(() => {
    // Add copy buttons to code blocks after render
    const addCopyButtons = () => {
      const codeBlocks = document.querySelectorAll("pre code");
      codeBlocks.forEach((block) => {
        const pre = block.parentElement;
        if (!pre || pre.querySelector(".copy-button")) return;

        const button = document.createElement("button");
        button.className = "copy-button";
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
        
        button.onclick = () => {
          const code = block.textContent || "";
          navigator.clipboard.writeText(code);
          button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
          toast.success("Code copied to clipboard");
          setTimeout(() => {
            button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
          }, 2000);
        };

        pre.style.position = "relative";
        pre.appendChild(button);
      });
    };

    const timer = setTimeout(addCopyButtons, 100);
    return () => clearTimeout(timer);
  }, [sectionId]);

  if (!section) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Section not found</p>
      </div>
    );
  }

  const renderSection = (sec: DocSection, level: number = 1) => {
    const headingLevel = Math.min(level + 1, 6);
    
    return (
      <div key={sec.id} className="mb-8">
        {level > 0 && (
          <>
            {headingLevel === 2 && <h2 id={sec.id} className={`font-bold mb-4 ${level === 1 ? 'text-3xl' : level === 2 ? 'text-2xl' : 'text-xl'}`}>{sec.title}</h2>}
            {headingLevel === 3 && <h3 id={sec.id} className={`font-bold mb-4 ${level === 1 ? 'text-3xl' : level === 2 ? 'text-2xl' : 'text-xl'}`}>{sec.title}</h3>}
            {headingLevel === 4 && <h4 id={sec.id} className={`font-bold mb-4 ${level === 1 ? 'text-3xl' : level === 2 ? 'text-2xl' : 'text-xl'}`}>{sec.title}</h4>}
            {headingLevel === 5 && <h5 id={sec.id} className={`font-bold mb-4 ${level === 1 ? 'text-3xl' : level === 2 ? 'text-2xl' : 'text-xl'}`}>{sec.title}</h5>}
            {headingLevel === 6 && <h6 id={sec.id} className={`font-bold mb-4 ${level === 1 ? 'text-3xl' : level === 2 ? 'text-2xl' : 'text-xl'}`}>{sec.title}</h6>}
          </>
        )}
        
        {sec.content && (
          <div className="prose max-w-none">
            <Streamdown>{sec.content}</Streamdown>
          </div>
        )}
        
        {sec.subsections && (
          <div className="mt-6 space-y-6">
            {sec.subsections.map(sub => renderSection(sub, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const getBreadcrumbs = () => {
    const breadcrumbs = [{ label: "Documentation" }];
    if (section) {
      breadcrumbs.push({ label: section.title });
    }
    return breadcrumbs;
  };

  return (
    <div className="max-w-4xl">
      <Breadcrumb items={getBreadcrumbs()} />
      {renderSection(section, 1)}
      
      {section.subsections && section.subsections.length > 0 && (
        <div className="mt-12 pt-8 border-t border-border">
          <h3 className="text-lg font-semibold mb-4">In this section:</h3>
          <ul className="space-y-2">
            {section.subsections.map(sub => (
              <li key={sub.id}>
                <a 
                  href={`#${sub.id}`}
                  className="text-primary hover:underline"
                >
                  {sub.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
