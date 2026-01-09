import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

describe("Alert Components", () => {
  describe("Alert", () => {
    it("renders with default variant", () => {
      render(<Alert data-testid="alert">Alert content</Alert>);
      const alert = screen.getByTestId("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute("role", "alert");
      expect(alert).toHaveClass("bg-background", "text-foreground");
    });

    it("renders with destructive variant", () => {
      render(<Alert variant="destructive" data-testid="alert">Error</Alert>);
      const alert = screen.getByTestId("alert");
      expect(alert).toHaveClass("border-destructive/50", "text-destructive");
    });

    it("accepts custom className", () => {
      render(<Alert className="custom-alert" data-testid="alert">Content</Alert>);
      expect(screen.getByTestId("alert")).toHaveClass("custom-alert");
    });

    it("has proper accessibility role", () => {
      render(<Alert>Accessible alert</Alert>);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("renders children correctly", () => {
      render(<Alert><span data-testid="child">Child</span></Alert>);
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
  });

  describe("AlertTitle", () => {
    it("renders as h5 element", () => {
      render(<AlertTitle>Alert Title</AlertTitle>);
      const title = screen.getByRole("heading", { level: 5 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent("Alert Title");
    });

    it("has correct styling", () => {
      render(<AlertTitle data-testid="title">Title</AlertTitle>);
      expect(screen.getByTestId("title")).toHaveClass("font-medium", "leading-none");
    });

    it("accepts custom className", () => {
      render(<AlertTitle className="custom" data-testid="title">Title</AlertTitle>);
      expect(screen.getByTestId("title")).toHaveClass("custom");
    });
  });

  describe("AlertDescription", () => {
    it("renders with correct styling", () => {
      render(<AlertDescription data-testid="desc">Description</AlertDescription>);
      expect(screen.getByTestId("desc")).toHaveClass("text-sm");
    });

    it("renders paragraph content correctly", () => {
      render(
        <AlertDescription>
          <p>First paragraph</p>
          <p>Second paragraph</p>
        </AlertDescription>
      );
      expect(screen.getByText("First paragraph")).toBeInTheDocument();
      expect(screen.getByText("Second paragraph")).toBeInTheDocument();
    });
  });

  describe("Alert Composition with Icon", () => {
    it("renders alert with icon correctly", () => {
      render(
        <Alert data-testid="alert-with-icon">
          <AlertCircle className="h-4 w-4" data-testid="icon" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            You can add components to your app using the cli.
          </AlertDescription>
        </Alert>
      );

      expect(screen.getByTestId("alert-with-icon")).toBeInTheDocument();
      expect(screen.getByTestId("icon")).toBeInTheDocument();
      expect(screen.getByText("Heads up!")).toBeInTheDocument();
      expect(screen.getByText(/You can add components/)).toBeInTheDocument();
    });

    it("renders success alert correctly", () => {
      render(
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>Operation completed successfully.</AlertDescription>
        </Alert>
      );

      expect(screen.getByText("Success!")).toBeInTheDocument();
      expect(screen.getByText("Operation completed successfully.")).toBeInTheDocument();
    });

    it("renders error alert with destructive variant", () => {
      render(
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Something went wrong.</AlertDescription>
        </Alert>
      );

      expect(screen.getByRole("alert")).toHaveClass("text-destructive");
      expect(screen.getByText("Error")).toBeInTheDocument();
    });
  });
});
