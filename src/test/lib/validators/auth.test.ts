/**
 * @fileoverview Testes para validadores de autenticação
 * @module test/lib/validators/auth.test
 */

import { describe, it, expect } from "vitest";
import {
  signUpSchema,
  signInSchema,
  calculatePasswordStrength,
  formatWhatsApp,
} from "@/lib/validators/auth";

describe("signInSchema", () => {
  it("should accept valid login data", () => {
    const result = signInSchema.safeParse({
      email: "user@example.com",
      password: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email in login", () => {
    const result = signInSchema.safeParse({
      email: "invalid",
      password: "123456",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty password in login", () => {
    const result = signInSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("should accept email with subdomain", () => {
    const result = signInSchema.safeParse({
      email: "user@mail.example.com",
      password: "password",
    });
    expect(result.success).toBe(true);
  });
});

describe("signUpSchema", () => {
  it("should accept valid signup data", () => {
    const result = signUpSchema.safeParse({
      fullName: "Maria Silva",
      email: "newuser@example.com",
      password: "SecurePass1",
      confirmPassword: "SecurePass1",
    });
    expect(result.success).toBe(true);
  });

  it("should reject mismatched passwords", () => {
    const result = signUpSchema.safeParse({
      fullName: "Maria Silva",
      email: "newuser@example.com",
      password: "Password1",
      confirmPassword: "Password2",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const hasPasswordError = result.error.issues.some(
        (issue) => issue.path.includes("confirmPassword")
      );
      expect(hasPasswordError).toBe(true);
    }
  });

  it("should reject weak password without uppercase", () => {
    const result = signUpSchema.safeParse({
      fullName: "Maria Silva",
      email: "newuser@example.com",
      password: "password1",
      confirmPassword: "password1",
    });
    expect(result.success).toBe(false);
  });

  it("should reject weak password without number", () => {
    const result = signUpSchema.safeParse({
      fullName: "Maria Silva",
      email: "newuser@example.com",
      password: "Password",
      confirmPassword: "Password",
    });
    expect(result.success).toBe(false);
  });

  it("should reject short password", () => {
    const result = signUpSchema.safeParse({
      fullName: "Maria Silva",
      email: "newuser@example.com",
      password: "Pass1",
      confirmPassword: "Pass1",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid name with numbers", () => {
    const result = signUpSchema.safeParse({
      fullName: "Maria123",
      email: "user@example.com",
      password: "SecurePass1",
      confirmPassword: "SecurePass1",
    });
    expect(result.success).toBe(false);
  });

  it("should accept optional whatsapp", () => {
    const result = signUpSchema.safeParse({
      fullName: "Maria Silva",
      email: "newuser@example.com",
      password: "SecurePass1",
      confirmPassword: "SecurePass1",
      whatsapp: "(11) 99999-9999",
    });
    expect(result.success).toBe(true);
  });
});

describe("calculatePasswordStrength", () => {
  it("should return weak for short password", () => {
    const result = calculatePasswordStrength("abc");
    expect(result.label).toBe("fraca");
  });

  it("should return medium for moderate password", () => {
    const result = calculatePasswordStrength("Password1");
    expect(result.label).toBe("média");
  });

  it("should return strong for complex password", () => {
    const result = calculatePasswordStrength("SecurePass123!");
    expect(result.label).toBe("forte");
  });
});

describe("formatWhatsApp", () => {
  it("should format partial number", () => {
    expect(formatWhatsApp("11")).toBe("(11");
    expect(formatWhatsApp("119")).toBe("(11) 9");
  });

  it("should format complete number", () => {
    expect(formatWhatsApp("11999999999")).toBe("(11) 99999-9999");
  });

  it("should handle empty string", () => {
    expect(formatWhatsApp("")).toBe("");
  });

  it("should strip non-numeric characters", () => {
    expect(formatWhatsApp("(11) 99999-9999")).toBe("(11) 99999-9999");
  });
});
