/**
 * @fileoverview Testes para a função utilitária cn
 * @module test/lib/utils.test
 */

import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (classNames utility)", () => {
  it("should combine multiple class strings", () => {
    const result = cn("class1", "class2", "class3");
    expect(result).toBe("class1 class2 class3");
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    const isDisabled = false;
    const result = cn("base", isActive && "active", isDisabled && "disabled");
    expect(result).toBe("base active");
  });

  it("should handle object syntax", () => {
    const result = cn("base", { active: true, disabled: false });
    expect(result).toBe("base active");
  });

  it("should merge conflicting Tailwind classes", () => {
    // tailwind-merge should keep only the last conflicting class
    const result = cn("p-2", "p-4");
    expect(result).toBe("p-4");
  });

  it("should merge conflicting text colors", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  it("should handle undefined and null values", () => {
    const result = cn("base", undefined, null, "end");
    expect(result).toBe("base end");
  });

  it("should handle empty strings", () => {
    const result = cn("base", "", "end");
    expect(result).toBe("base end");
  });

  it("should handle array of classes", () => {
    const result = cn(["class1", "class2"]);
    expect(result).toBe("class1 class2");
  });

  it("should merge complex Tailwind utility conflicts", () => {
    const result = cn(
      "px-2 py-1 bg-red-500 hover:bg-red-600",
      "px-4 bg-blue-500"
    );
    expect(result).toContain("px-4");
    expect(result).toContain("bg-blue-500");
    expect(result).toContain("py-1");
    expect(result).not.toContain("px-2");
    expect(result).not.toContain("bg-red-500");
  });
});
