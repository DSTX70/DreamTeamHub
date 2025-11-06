import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { usePublishDialog } from "@/hooks/usePublishDialog";
import TwoManPublishDialog from "@/components/TwoManPublishDialog";
import { Search, Upload, FileUp } from "lucide-react";

export function KnowledgeModals({
  ownerType,
  ownerId,
  scope,
}: {
  ownerType: "bu" | "brand" | "product" | "project";
  ownerId: string;
  scope: string;
}) {
  const { toast } = useToast();
  const [searchOpen, setSearchOpen] = useState(false);
  const [draftOpen, setDraftOpen] = useState(false);
  const [publishInputOpen, setPublishInputOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Draft state
  const [draftFileName, setDraftFileName] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [uploading, setUploading] = useState(false);

  // Publish input state (for file ID before two-reviewer dialog)
  const [publishFileId, setPublishFileId] = useState("");

  // Two-reviewer publish dialog
  const publishDialog = usePublishDialog({
    owner: ownerType.toUpperCase() as "BU" | "BRAND" | "PRODUCT",
    ownerId,
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `/api/knowledge/${ownerType}/${ownerId}/search?q=${encodeURIComponent(searchQuery)}`
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults(data.items || []);
      
      // Check for pagination header
      const nextPageToken = res.headers.get("X-Next-Page-Token");
      if (nextPageToken) {
        console.log("X-Next-Page-Token present:", nextPageToken);
      }
      
      toast({
        title: "Search complete",
        description: `Found ${data.items?.length || 0} results`,
      });
    } catch (error: any) {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleDraftUpload = async () => {
    if (!draftFileName.trim() || !draftContent.trim()) return;
    setUploading(true);
    try {
      const res = await fetch(`/api/knowledge/${ownerType}/${ownerId}/drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: draftFileName,
          content: draftContent,
        }),
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      
      toast({
        title: "Draft uploaded",
        description: `File ID: ${data.id || data.fileId}`,
      });
      
      // Reset form
      setDraftFileName("");
      setDraftContent("");
      setDraftOpen(false);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleStartPublish = () => {
    if (!publishFileId.trim()) return;
    // Start the two-reviewer publish dialog
    publishDialog.start(publishFileId);
    // Close the file ID input modal
    setPublishInputOpen(false);
    // Reset file ID input
    setPublishFileId("");
    
    toast({
      title: "Starting publish approval",
      description: "Two reviewers required to complete publish",
    });
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSearchOpen(true)}
          data-testid="button-search-knowledge"
        >
          <Search className="h-4 w-4 mr-2" />
          Search Drive
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDraftOpen(true)}
          data-testid="button-upload-draft"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Draft
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPublishInputOpen(true)}
          data-testid="button-publish-file"
        >
          <FileUp className="h-4 w-4 mr-2" />
          Publish File
        </Button>
      </div>

      {/* Search Modal */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Search Knowledge Base</DialogTitle>
            <DialogDescription>
              Search Google Drive for files in {scope}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter search query..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                data-testid="input-search-query"
              />
              <Button
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                data-testid="button-execute-search"
              >
                {searching ? "Searching..." : "Search"}
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {searchResults.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-3 border rounded-md"
                    data-testid={`search-result-${idx}`}
                  >
                    <div className="font-medium">{file.name}</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {file.id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Draft Upload Modal */}
      <Dialog open={draftOpen} onOpenChange={setDraftOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Draft</DialogTitle>
            <DialogDescription>
              Upload a draft file to Google Drive
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="draft-filename">File Name</Label>
              <Input
                id="draft-filename"
                placeholder="My Document!@#$%^&*().txt"
                value={draftFileName}
                onChange={(e) => setDraftFileName(e.target.value)}
                data-testid="input-draft-filename"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="draft-content">Content</Label>
              <Textarea
                id="draft-content"
                placeholder="Enter file content..."
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                rows={8}
                data-testid="textarea-draft-content"
              />
            </div>
            <Button
              onClick={handleDraftUpload}
              disabled={uploading || !draftFileName.trim() || !draftContent.trim()}
              className="w-full"
              data-testid="button-submit-draft"
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* File ID Input Modal (Step 1 before two-reviewer dialog) */}
      <Dialog open={publishInputOpen} onOpenChange={setPublishInputOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Start Publish Approval</DialogTitle>
            <DialogDescription>
              Enter the Google Drive file ID to start the two-reviewer publish approval process
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="publish-fileid">File ID</Label>
              <Input
                id="publish-fileid"
                placeholder="Google Drive File ID"
                value={publishFileId}
                onChange={(e) => setPublishFileId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStartPublish()}
                data-testid="input-publish-fileid"
              />
            </div>
            <Button
              onClick={handleStartPublish}
              disabled={!publishFileId.trim()}
              className="w-full"
              data-testid="button-start-approval"
            >
              Start Approval
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Two-Reviewer Publish Dialog (Step 2) */}
      <TwoManPublishDialog
        open={publishDialog.open}
        onClose={publishDialog.close}
        onConfirm={publishDialog.confirm}
        fileId={publishDialog.fileId || ""}
        contextLabel={scope}
      />
    </>
  );
}
