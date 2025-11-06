import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Package, FolderKanban } from "lucide-react";
import type { Brand, Project, Product } from "@shared/schema";

interface BrandDetailsModalProps {
  brand: Brand | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BrandDetailsModal({ brand, open, onOpenChange }: BrandDetailsModalProps) {
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: brand ? ['/api/projects', `brandId:${brand.id}`] : [],
    queryFn: async () => {
      if (!brand) return [];
      const res = await fetch(`/api/projects?brandId=${brand.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
    enabled: !!brand && open,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: brand ? ['/api/products', `brandId:${brand.id}`] : [],
    queryFn: async () => {
      if (!brand) return [];
      const res = await fetch(`/api/products?brandId=${brand.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
    enabled: !!brand && open,
  });

  if (!brand) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="modal-brand-details">
        <DialogHeader>
          <DialogTitle className="text-2xl" data-testid="text-brand-modal-name">{brand.name}</DialogTitle>
          <DialogDescription>
            {brand.description || `Brand in ${brand.businessUnit} business unit`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-products-count">{products.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-projects-count">{projects.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Business Unit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-semibold" data-testid="text-business-unit">{brand.businessUnit}</div>
              </CardContent>
            </Card>
          </div>

          {/* Products Section */}
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <Package className="h-5 w-5" />
              Products
            </h3>
            {productsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : products.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  No products yet
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {products.map((product) => (
                  <Card key={product.id} data-testid={`card-product-${product.id}`}>
                    <CardHeader>
                      <CardTitle className="text-base" data-testid={`text-product-name-${product.id}`}>
                        {product.name}
                      </CardTitle>
                      {product.description && (
                        <CardDescription>{product.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={product.status === 'active' ? 'default' : 'secondary'} data-testid={`badge-product-status-${product.id}`}>
                          {product.status}
                        </Badge>
                        {product.launched && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(product.launched).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Projects Section */}
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <FolderKanban className="h-5 w-5" />
              Projects
            </h3>
            {projectsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : projects.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <FolderKanban className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  No projects yet
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {projects.map((project) => (
                  <Card key={project.id} data-testid={`card-project-${project.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base" data-testid={`text-project-title-${project.id}`}>
                            {project.title}
                          </CardTitle>
                          {project.description && (
                            <CardDescription>{project.description}</CardDescription>
                          )}
                        </div>
                        <Badge variant="outline" data-testid={`badge-project-status-${project.id}`}>
                          {project.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {project.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {new Date(project.dueDate).toLocaleDateString()}
                          </div>
                        )}
                        <Badge variant="secondary">{project.category}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
