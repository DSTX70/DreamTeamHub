import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Search } from "lucide-react";

interface Playbook {
  id: number;
  handle: string;
  title: string;
  bodyMd: string;
  createdAt: string;
}

export default function PlaybooksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { data: playbooks, isLoading } = useQuery<Playbook[]>({
    queryKey: ["/api/playbooks", { query: debouncedQuery }],
  });

  const handleSearch = () => {
    setDebouncedQuery(searchQuery);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <BookOpen className="h-8 w-8" />
            Playbooks Registry
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage reusable playbooks for Work Orders
          </p>
        </div>
        <Link href="/playbooks/new">
          <Button data-testid="button-new-playbook">
            <Plus className="h-4 w-4 mr-2" />
            New Playbook
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Playbooks</CardTitle>
          <CardDescription>Find playbooks by title or handle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search playbooks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              data-testid="input-search"
            />
            <Button onClick={handleSearch} data-testid="button-search">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : !playbooks?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2" data-testid="text-no-playbooks">
              No playbooks found
            </h3>
            <p className="text-muted-foreground mb-4">
              {debouncedQuery ? "Try a different search term" : "Create your first playbook to get started"}
            </p>
            <Link href="/playbooks/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Playbook
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3" data-testid="list-playbooks">
          {playbooks.map(playbook => (
            <Link key={playbook.handle} href={`/playbooks/${playbook.handle}`}>
              <Card className="hover-elevate cursor-pointer" data-testid={`card-playbook-${playbook.handle}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg" data-testid={`text-title-${playbook.handle}`}>
                        {playbook.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <Badge variant="outline" className="font-mono text-xs">
                          {playbook.handle}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                    {playbook.bodyMd.substring(0, 150)}...
                  </p>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
