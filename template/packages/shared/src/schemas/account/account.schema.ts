import { z } from "zod";

import { emailSchema, passwordSchema } from "../base.schema";

export const signInSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password must be less than 128 characters."),
});

export const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(128),
  lastName: z.string().min(1, "Last name is required").max(128),
  email: emailSchema,
  password: passwordSchema,
});

export const resendEmailSchema = z.object({
  email: emailSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: passwordSchema,
});

export const updateProfileSchema = z
  .object({
    firstName: z.string().min(1).max(128),
    lastName: z.string().min(1).max(128),
    password: z.union([passwordSchema, z.literal("")]),
  })
  .partial();

export const verifyTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const googleMobileSchema = z.object({
  idToken: z.string().min(1, "ID token is required"),
});
