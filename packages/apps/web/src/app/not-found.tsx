import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 md:py-24">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center py-16">
        <h1 className="text-6xl md:text-9xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl md:text-4xl font-semibold mb-6">Page Not Found</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Sorry, we couldn't find the page you're looking for. It might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/">Go back home</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/support">Contact support</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}