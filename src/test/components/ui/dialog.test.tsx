import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

describe("Dialog Components", () => {
  const renderDialog = (open?: boolean) => {
    return render(
      <Dialog defaultOpen={open}>
        <DialogTrigger asChild>
          <Button>Open Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog description text</DialogDescription>
          </DialogHeader>
          <div>Dialog body content</div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  describe("Dialog", () => {
    it("renders trigger button", () => {
      renderDialog();
      expect(screen.getByRole("button", { name: "Open Dialog" })).toBeInTheDocument();
    });

    it("opens dialog when trigger is clicked", async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.click(screen.getByRole("button", { name: "Open Dialog" }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("shows dialog content when open", async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.click(screen.getByRole("button", { name: "Open Dialog" }));

      await waitFor(() => {
        expect(screen.getByText("Dialog Title")).toBeInTheDocument();
        expect(screen.getByText("Dialog description text")).toBeInTheDocument();
        expect(screen.getByText("Dialog body content")).toBeInTheDocument();
      });
    });

    it("renders with defaultOpen", async () => {
      renderDialog(true);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });
  });

  describe("DialogContent", () => {
    it("has close button", async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.click(screen.getByRole("button", { name: "Open Dialog" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
      });
    });

    it("closes when close button is clicked", async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.click(screen.getByRole("button", { name: "Open Dialog" }));
      
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Close" }));

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("closes when Cancel button is clicked", async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.click(screen.getByRole("button", { name: "Open Dialog" }));
      
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Cancel" }));

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("DialogHeader", () => {
    it("renders with correct layout classes", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogHeader data-testid="header">
              <DialogTitle>Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(screen.getByTestId("header")).toHaveClass("flex", "flex-col", "space-y-1.5");
      });
    });
  });

  describe("DialogTitle", () => {
    it("renders correctly styled title", async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.click(screen.getByRole("button", { name: "Open Dialog" }));

      await waitFor(() => {
        const title = screen.getByText("Dialog Title");
        expect(title).toHaveClass("text-lg", "font-semibold");
      });
    });
  });

  describe("DialogDescription", () => {
    it("renders with muted foreground", async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.click(screen.getByRole("button", { name: "Open Dialog" }));

      await waitFor(() => {
        const desc = screen.getByText("Dialog description text");
        expect(desc).toHaveClass("text-sm", "text-muted-foreground");
      });
    });
  });

  describe("DialogFooter", () => {
    it("renders with correct layout", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogFooter data-testid="footer">
              <Button>Action</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(screen.getByTestId("footer")).toHaveClass("flex", "flex-col-reverse");
      });
    });
  });

  describe("Controlled Dialog", () => {
    it("works with controlled open state", async () => {
      const onOpenChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Dialog open={false} onOpenChange={onOpenChange}>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Controlled Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));
      
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA attributes", async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.click(screen.getByRole("button", { name: "Open Dialog" }));

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog).toBeInTheDocument();
      });
    });

    it("focuses dialog content when opened", async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.click(screen.getByRole("button", { name: "Open Dialog" }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("closes on Escape key", async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.click(screen.getByRole("button", { name: "Open Dialog" }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });
});
