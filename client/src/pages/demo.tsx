import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Demo() {
  const { toast } = useToast();

  const handleExport = () => {
    const link = document.createElement('a');
    link.href = '/demo.html';
    link.download = 'dream-team-hub-demo.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Demo exported",
      description: "Standalone HTML file downloaded successfully",
    });
  };

  return (
    <div className="relative h-full w-full">
      <div className="absolute top-4 right-4 z-50">
        <Button
          onClick={handleExport}
          className="shadow-lg"
          data-testid="button-export-demo"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Demo
        </Button>
      </div>
      
      <iframe
        src="/demo.html"
        className="w-full h-full border-0"
        title="Dream Team Hub Interactive Demo"
        data-testid="iframe-demo"
      />
    </div>
  );
}
