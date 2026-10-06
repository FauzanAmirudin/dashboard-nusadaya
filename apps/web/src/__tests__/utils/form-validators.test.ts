import { describe, expect, it, mock, spyOn } from "bun:test";
import { toast } from "sonner";
import {
	filterAlphaNumeric,
	filterFinanceInteger,
	filterFinanceIntegerString,
	filterNumeric,
	filterPhone,
	isValidEmail,
	validateIntegerRange,
} from "../../utils/form-validators";

describe("Tahap 1.1 - 1.6: form-validators.ts", () => {
	// Task 1.1: filterNumeric()
	describe("Task 1.1 — filterNumeric()", () => {
		it("should return clean numeric string as is", () => {
			expect(filterNumeric("123456")).toBe("123456");
		});

		it("should strip alphabetic characters and keep only digits", () => {
			expect(filterNumeric("abc123def456")).toBe("123456");
		});

		it("should truncate string to maxLength when exceeded", () => {
			expect(filterNumeric("1234567890", 5)).toBe("12345");
		});

		it("should remove symbols and special characters", () => {
			expect(filterNumeric("12@34#56$!")).toBe("123456");
		});

		it("should return empty string when input is empty", () => {
			expect(filterNumeric("")).toBe("");
		});

		it("should not truncate when maxLength is undefined", () => {
			const longDigits = "12345678901234567890";
			expect(filterNumeric(longDigits)).toBe(longDigits);
		});

		it("should return empty string when input contains only whitespace", () => {
			expect(filterNumeric("    ")).toBe("");
		});
	});

	// Task 1.2: filterPhone()
	describe("Task 1.2 — filterPhone()", () => {
		it("should return valid phone number with leading + as is", () => {
			expect(filterPhone("+628123456789")).toBe("+628123456789");
		});

		it("should remove '+' when placed in the middle or end of string", () => {
			expect(filterPhone("0812+345+678")).toBe("0812345678");
		});

		it("should strip letters from phone number", () => {
			expect(filterPhone("+62abc8123xyz")).toBe("+628123");
		});

		it("should truncate when length exceeds default maxLength 15", () => {
			const phone18 = "+6281234567890123"; // 17 chars
			expect(filterPhone(phone18)).toBe(phone18.slice(0, 15));
			expect(filterPhone(phone18).length).toBe(15);
		});

		it("should return single '+' when input contains only '+'", () => {
			expect(filterPhone("+")).toBe("+");
		});

		it("should return empty string when input is empty", () => {
			expect(filterPhone("")).toBe("");
		});
	});

	// Task 1.3: filterAlphaNumeric()
	describe("Task 1.3 — filterAlphaNumeric()", () => {
		it("should return valid alphanumeric with underscore as is", () => {
			expect(filterAlphaNumeric("user_name_123")).toBe("user_name_123");
		});

		it("should remove spaces from input", () => {
			expect(filterAlphaNumeric("user name 123")).toBe("username123");
		});

		it("should remove symbols like @, #, $, !", () => {
			expect(filterAlphaNumeric("user@#$name!")).toBe("username");
		});

		it("should remove underscores when allowUnderscore is false", () => {
			expect(filterAlphaNumeric("user_name_123", 30, false)).toBe(
				"username123",
			);
		});

		it("should truncate when exceeding maxLength", () => {
			expect(filterAlphaNumeric("abcdefghij", 5)).toBe("abcde");
		});
	});

	// Task 1.4: isValidEmail()
	describe("Task 1.4 — isValidEmail()", () => {
		it("should return true for valid standard email", () => {
			expect(isValidEmail("user@example.com")).toBe(true);
		});

		it("should return false for email without domain user@", () => {
			expect(isValidEmail("user@")).toBe(false);
		});

		it("should return false for email without TLD user@example", () => {
			expect(isValidEmail("user@example")).toBe(false);
		});

		it("should return false for email containing spaces", () => {
			expect(isValidEmail("user name@example.com")).toBe(false);
		});

		it("should return false for empty string or whitespace", () => {
			expect(isValidEmail("")).toBe(false);
			expect(isValidEmail("   ")).toBe(false);
		});

		it("should return true for email with complex subdomain", () => {
			expect(isValidEmail("user@mail.example.co.id")).toBe(true);
		});
	});

	// Task 1.5: validateIntegerRange()
	describe("Task 1.5 — validateIntegerRange()", () => {
		it("should validate number within range", () => {
			const result = validateIntegerRange(50, 1, 100);
			expect(result.isValid).toBe(true);
			expect(result.message).toBeUndefined();
		});

		it("should fail when number is below min with informative message", () => {
			const result = validateIntegerRange(0, 1, 100, "Semester");
			expect(result.isValid).toBe(false);
			expect(result.message).toContain("1 - 100");
			expect(result.message).toContain("Semester");
		});

		it("should fail when number is above max with informative message", () => {
			const result = validateIntegerRange(101, 1, 100, "Nilai");
			expect(result.isValid).toBe(false);
			expect(result.message).toContain("1 - 100");
		});

		it("should succeed when number is exactly at min boundary", () => {
			const result = validateIntegerRange(1, 1, 100);
			expect(result.isValid).toBe(true);
		});

		it("should succeed when number is exactly at max boundary", () => {
			const result = validateIntegerRange(100, 1, 100);
			expect(result.isValid).toBe(true);
		});

		it("should accept valid string number", () => {
			const result = validateIntegerRange("25", 1, 100);
			expect(result.isValid).toBe(true);
		});

		it("should fail when input string is not a valid number", () => {
			const result = validateIntegerRange("abc", 1, 100, "Skor");
			expect(result.isValid).toBe(false);
			expect(result.message).toContain("harus berupa angka valid");
		});
	});

	// Task 1.6: filterFinanceInteger()
	describe("Task 1.6 — filterFinanceInteger()", () => {
		it("should convert formatted currency string with thousand separator to integer", () => {
			expect(filterFinanceInteger("1.000.000")).toBe(1000000);
		});

		it("should convert clean numeric string to number", () => {
			expect(filterFinanceInteger("999999")).toBe(999999);
		});

		it("should truncate to first 9 digits when input exceeds 9 digits", () => {
			// 12 digits: 123456789012 -> 123456789
			expect(filterFinanceInteger("123456789012")).toBe(123456789);
		});

		it("should return 0 when input is empty string, null, or undefined", () => {
			expect(filterFinanceInteger("")).toBe(0);
			expect(filterFinanceInteger(null as any)).toBe(0);
			expect(filterFinanceInteger(undefined as any)).toBe(0);
		});

		it("should return 0 when input contains only non-digit characters", () => {
			expect(filterFinanceInteger("Rp. ---")).toBe(0);
		});

		it("should also correctly support filterFinanceIntegerString helper", () => {
			expect(filterFinanceIntegerString("1.500.000")).toBe("1500000");
			expect(filterFinanceIntegerString("1234567899999")).toBe("123456789");
		});
	});
});
