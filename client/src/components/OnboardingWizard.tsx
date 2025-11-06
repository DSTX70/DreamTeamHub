import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Check } from "lucide-react";

interface OnboardingWizardProps {
  businessUnit: string; // IMAGINATION, INNOVATION, IMPACT
}

export default function OnboardingWizard({ businessUnit }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [brand, setBrand] = useState({ name: "", slug: "" });
  const [product, setProduct] = useState({ name: "", slug: "", status: "active" });
  const [drive, setDrive] = useState({ readFolderId: "", draftFolderId: "", publishFolderId: "" });
  const [created, setCreated] = useState<{ brandId?: number; productId?: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => Math.max(1, s - 1));

  async function createBrand() {
    setIsLoading(true);
    try {
      const result = await apiRequest("/api/onboarding/brand", {
        method: "POST",
        body: JSON.stringify({
          businessUnit,
          name: brand.name,
          slug: brand.slug,
          drive
        })
      });

      if (!result.ok) throw new Error("Brand creation failed");
      const data = await result.json();
      
      setCreated({ brandId: data.brand.id });
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      
      toast({
        title: "Brand created",
        description: `${brand.name} has been created successfully.`
      });
      
      next();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create brand. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function createProduct() {
    if (!created?.brandId || !product.name) {
      next();
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiRequest("/api/onboarding/product", {
        method: "POST",
        body: JSON.stringify({
          brandId: created.brandId,
          name: product.name,
          slug: product.slug || undefined,
          status: product.status,
          drive
        })
      });

      if (!result.ok) throw new Error("Product creation failed");
      const data = await result.json();
      
      setCreated({ ...created, productId: data.product.id });
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      
      toast({
        title: "Product created",
        description: `${product.name} has been added to the brand.`
      });
      
      next();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create product. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Onboarding Wizard</CardTitle>
        <CardDescription>
          Create a new brand and optionally add your first product
        </CardDescription>
      </CardHeader>

      <CardContent>
        {step === 1 && (
          <div className="space-y-4" data-testid="onboarding-step-1">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              Step 1 of 4 — Brand Details
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-name">Brand Name</Label>
              <Input
                id="brand-name"
                data-testid="input-brand-name"
                placeholder="Enter brand name"
                value={brand.name}
                onChange={e => setBrand({ ...brand, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-slug">Brand Slug</Label>
              <Input
                id="brand-slug"
                data-testid="input-brand-slug"
                placeholder="brand-slug"
                value={brand.slug}
                onChange={e => setBrand({ ...brand, slug: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Use lowercase letters, numbers, and hyphens only
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4" data-testid="onboarding-step-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              Step 2 of 4 — Google Drive Folders
            </div>
            <p className="text-sm text-muted-foreground">
              Provide folder IDs for Read, Draft, and Publish permissions
            </p>
            <div className="space-y-2">
              <Label htmlFor="read-folder">Read Folder ID</Label>
              <Input
                id="read-folder"
                data-testid="input-read-folder"
                placeholder="Enter folder ID"
                value={drive.readFolderId}
                onChange={e => setDrive({ ...drive, readFolderId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="draft-folder">Draft Folder ID</Label>
              <Input
                id="draft-folder"
                data-testid="input-draft-folder"
                placeholder="Enter folder ID"
                value={drive.draftFolderId}
                onChange={e => setDrive({ ...drive, draftFolderId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publish-folder">Publish Folder ID</Label>
              <Input
                id="publish-folder"
                data-testid="input-publish-folder"
                placeholder="Enter folder ID"
                value={drive.publishFolderId}
                onChange={e => setDrive({ ...drive, publishFolderId: e.target.value })}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4" data-testid="onboarding-step-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              Step 3 of 4 — First Product (Optional)
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                data-testid="input-product-name"
                placeholder="Enter product name (optional)"
                value={product.name}
                onChange={e => setProduct({ ...product, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-slug">Product Slug (optional)</Label>
              <Input
                id="product-slug"
                data-testid="input-product-slug"
                placeholder="product-slug"
                value={product.slug}
                onChange={e => setProduct({ ...product, slug: e.target.value })}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4" data-testid="onboarding-step-4">
            <div className="flex items-center gap-2 text-base font-semibold text-green-600">
              <Check className="h-5 w-5" />
              <span>Onboarding Complete!</span>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              {created?.brandId && <div data-testid="text-brand-created">✓ Brand created successfully</div>}
              {created?.productId ? (
                <div data-testid="text-product-created">✓ Product created successfully</div>
              ) : (
                <div data-testid="text-no-product">• No product created (you can add products later)</div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        {step > 1 && step < 4 && (
          <Button
            variant="outline"
            onClick={back}
            disabled={isLoading}
            data-testid="button-back"
          >
            Back
          </Button>
        )}
        {step === 1 && (
          <Button
            onClick={next}
            disabled={!brand.name || !brand.slug}
            data-testid="button-next"
          >
            Next
          </Button>
        )}
        {step === 2 && (
          <Button
            onClick={createBrand}
            disabled={!drive.readFolderId || !drive.draftFolderId || !drive.publishFolderId || isLoading}
            data-testid="button-create-brand"
          >
            {isLoading ? "Creating..." : "Create Brand"}
          </Button>
        )}
        {step === 3 && (
          <Button
            onClick={createProduct}
            disabled={isLoading}
            data-testid="button-finish"
          >
            {isLoading ? "Creating..." : "Finish"}
          </Button>
        )}
        {step === 4 && (
          <Button
            onClick={() => window.location.reload()}
            data-testid="button-done"
          >
            Done
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
