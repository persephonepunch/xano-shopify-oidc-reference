import { Button } from "@/components/ui/button";
import { Code2, FileText, Github } from "lucide-react";

export default function Header() {
  const handleExport = () => {
    window.print();
  };

  return (
    <header className="border-b border-border bg-card sticky top-0 z-10">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Xano-Shopify OIDC Integration</h1>
            <p className="text-xs text-muted-foreground">API Reference Documentation</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('https://github.com', '_blank')}
          >
            <Github className="w-4 h-4 mr-2" />
            GitHub
          </Button>
        </div>
      </div>
    </header>
  );
}
