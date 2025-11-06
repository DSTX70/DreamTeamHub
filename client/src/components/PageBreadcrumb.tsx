import { Link } from "wouter";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

interface PageBreadcrumbProps {
  segments?: BreadcrumbSegment[];
}

export function PageBreadcrumb({ segments }: PageBreadcrumbProps) {
  if (!segments || segments.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList data-testid="breadcrumb-list">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          
          return (
            <div key={index} className="flex items-center">
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage data-testid={`breadcrumb-current-${segment.label.toLowerCase().replace(/\s+/g, '-')}`}>
                    {segment.label}
                  </BreadcrumbPage>
                ) : segment.href ? (
                  <BreadcrumbLink asChild>
                    <Link 
                      href={segment.href}
                      data-testid={`breadcrumb-link-${segment.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {segment.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <span data-testid={`breadcrumb-text-${segment.label.toLowerCase().replace(/\s+/g, '-')}`}>
                    {segment.label}
                  </span>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

// Helper function to build standard breadcrumb paths
export function buildBreadcrumbs(path: {
  home?: boolean;
  businessUnit?: { slug: string; name: string };
  brand?: { id: number; name: string };
  product?: { id: number; name: string };
  project?: { id: number; name: string };
  task?: { id: number; name: string };
  page?: string;
}): BreadcrumbSegment[] {
  const segments: BreadcrumbSegment[] = [];

  // Always start with i³ Collective home
  if (path.home !== false) {
    segments.push({ label: "i³ Collective", href: "/" });
  }

  // Business Unit
  if (path.businessUnit) {
    segments.push({
      label: path.businessUnit.name,
      href: `/bu/${path.businessUnit.slug.toLowerCase()}`,
    });
  }

  // Brand
  if (path.brand) {
    segments.push({
      label: path.brand.name,
      href: path.businessUnit 
        ? `/bu/${path.businessUnit.slug.toLowerCase()}?brand=${path.brand.id}`
        : undefined,
    });
  }

  // Product
  if (path.product) {
    segments.push({
      label: path.product.name,
      href: undefined, // Products don't have detail pages yet
    });
  }

  // Project
  if (path.project) {
    segments.push({
      label: path.project.name,
      href: `/project/${path.project.id}`,
    });
  }

  // Task
  if (path.task) {
    segments.push({
      label: path.task.name,
      href: undefined, // Tasks don't have detail pages yet
    });
  }

  // Generic page (for non-entity pages)
  if (path.page) {
    segments.push({
      label: path.page,
    });
  }

  return segments;
}
