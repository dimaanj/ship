import { z } from "zod";

import { ApiClient } from "./client";
import {
  emailSchema,
  forgotPasswordSchema,
  googleMobileSchema,
  paginationSchema,
  passwordSchema,
  resendEmailSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  updateProfileSchema,
  userSchema,
  verifyTokenSchema,
} from "./schemas";

// ─── Endpoint Definitions ───────────────────────────────────────────────

export const accountEndpoints = {
  signIn: {
    method: "post" as const,
    path: "/account/sign-in" as const,
    schema: signInSchema,
  },
  signUp: {
    method: "post" as const,
    path: "/account/sign-up" as const,
    schema: signUpSchema,
  },
  signOut: {
    method: "post" as const,
    path: "/account/sign-out" as const,
  },
  get: {
    method: "get" as const,
    path: "/account" as const,
  },
  update: {
    method: "put" as const,
    path: "/account" as const,
    schema: updateProfileSchema,
  },
  forgotPassword: {
    method: "post" as const,
    path: "/account/forgot-password" as const,
    schema: forgotPasswordSchema,
  },
  resetPassword: {
    method: "put" as const,
    path: "/account/reset-password" as const,
    schema: resetPasswordSchema,
  },
  verifyEmail: {
    method: "get" as const,
    path: "/account/verify-email" as const,
    schema: verifyTokenSchema,
  },
  verifyEmailToken: {
    method: "post" as const,
    path: "/account/verify-email/token" as const,
    schema: verifyTokenSchema,
  },
  verifyResetToken: {
    method: "get" as const,
    path: "/account/verify-reset-token" as const,
    schema: verifyTokenSchema,
  },
  resendEmail: {
    method: "post" as const,
    path: "/account/resend-email" as const,
    schema: resendEmailSchema,
  },
  google: {
    method: "get" as const,
    path: "/account/sign-in/google" as const,
  },
  googleCallback: {
    method: "get" as const,
    path: "/account/sign-in/google/callback" as const,
  },
  googleMobile: {
    method: "post" as const,
    path: "/account/sign-in/google/token" as const,
    schema: googleMobileSchema,
  },
} as const;

const usersListSchema = paginationSchema.extend({
  filter: z
    .object({
      createdOn: z
        .object({
          startDate: z.coerce.date().optional(),
          endDate: z.coerce.date().optional(),
        })
        .optional(),
    })
    .optional(),
  sort: z
    .object({
      firstName: z.enum(["asc", "desc"]).optional(),
      lastName: z.enum(["asc", "desc"]).optional(),
      createdOn: z.enum(["asc", "desc"]).default("asc"),
    })
    .default({ createdOn: "asc" }),
});

const usersUpdateSchema = userSchema.pick({
  firstName: true,
  lastName: true,
  email: true,
});

export const usersEndpoints = {
  list: {
    method: "get" as const,
    path: "/users" as const,
    schema: usersListSchema,
  },
  update: {
    method: "put" as const,
    path: "/users/:id" as const,
    schema: usersUpdateSchema,
  },
  remove: {
    method: "delete" as const,
    path: "/users/:id" as const,
  },
} as const;

// ─── Schemas Object (grouped by resource) ───────────────────────────────

export const schemas = {
  account: {
    signIn: accountEndpoints.signIn.schema,
    signUp: accountEndpoints.signUp.schema,
    update: accountEndpoints.update.schema,
    forgotPassword: accountEndpoints.forgotPassword.schema,
    resetPassword: accountEndpoints.resetPassword.schema,
    verifyEmail: accountEndpoints.verifyEmail.schema,
    verifyEmailToken: accountEndpoints.verifyEmailToken.schema,
    verifyResetToken: accountEndpoints.verifyResetToken.schema,
    resendEmail: accountEndpoints.resendEmail.schema,
    googleMobile: accountEndpoints.googleMobile.schema,
  },
  users: {
    list: usersEndpoints.list.schema,
    update: usersEndpoints.update.schema,
  },
} as const;

// ─── Param Types ────────────────────────────────────────────────────────

export type AccountSignInParams = z.infer<typeof schemas.account.signIn>;
export type AccountSignUpParams = z.infer<typeof schemas.account.signUp>;
export type AccountUpdateParams = z.infer<typeof schemas.account.update>;
export type AccountForgotPasswordParams = z.infer<
  typeof schemas.account.forgotPassword
>;
export type AccountResetPasswordParams = z.infer<
  typeof schemas.account.resetPassword
>;
export type AccountVerifyEmailParams = z.infer<
  typeof schemas.account.verifyEmail
>;
export type AccountVerifyEmailTokenParams = z.infer<
  typeof schemas.account.verifyEmailToken
>;
export type AccountVerifyResetTokenParams = z.infer<
  typeof schemas.account.verifyResetToken
>;
export type AccountResendEmailParams = z.infer<
  typeof schemas.account.resendEmail
>;
export type AccountGoogleMobileParams = z.infer<
  typeof schemas.account.googleMobile
>;

export type UsersListParams = z.infer<typeof schemas.users.list>;
export type UsersUpdateParams = z.infer<typeof schemas.users.update>;

// ─── Path Param Types ───────────────────────────────────────────────────

export type UsersUpdatePathParams = { id: string };
export type UsersRemovePathParams = { id: string };

// ─── Response Types ─────────────────────────────────────────────────────

export interface UserResponse {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  isEmailVerified: boolean;
  avatarUrl?: string | null;
  oauth?: { google?: { userId: string; connectedOn: string } };
  lastRequest?: string;
  createdOn?: string;
  updatedOn?: string;
  deletedOn?: string | null;
}

export type AccountGetResponse = UserResponse;
export type AccountSignInResponse = UserResponse;
export type AccountSignUpResponse = { emailVerificationToken?: string };
export type AccountUpdateResponse = UserResponse | null;
export type AccountGoogleMobileResponse = {
  accessToken: string;
  user: UserResponse;
};
export type AccountVerifyEmailTokenResponse = {
  accessToken: string;
  user: UserResponse;
};
export type UsersListResponse = {
  results: UserResponse[];
  pagesCount: number;
  count: number;
};
export type UsersUpdateResponse = UserResponse | null;

// ─── Endpoint Creator ───────────────────────────────────────────────────

function createAccountEndpoints(client: ApiClient) {
  return {
    signIn: {
      method: accountEndpoints.signIn.method,
      path: accountEndpoints.signIn.path,
      schema: schemas.account.signIn,
      call: (
        params: AccountSignInParams,
        options?: { headers?: Record<string, string> },
      ) =>
        client.post<AccountSignInResponse>(
          accountEndpoints.signIn.path,
          params,
          options?.headers ? { headers: options.headers } : undefined,
        ),
    },
    signUp: {
      method: accountEndpoints.signUp.method,
      path: accountEndpoints.signUp.path,
      schema: schemas.account.signUp,
      call: (
        params: AccountSignUpParams,
        options?: { headers?: Record<string, string> },
      ) =>
        client.post<AccountSignUpResponse>(
          accountEndpoints.signUp.path,
          params,
          options?.headers ? { headers: options.headers } : undefined,
        ),
    },
    signOut: {
      method: accountEndpoints.signOut.method,
      path: accountEndpoints.signOut.path,
      schema: undefined,
      call: (
        params?: Record<string, unknown>,
        options?: { headers?: Record<string, string> },
      ) =>
        client.post<void>(
          accountEndpoints.signOut.path,
          params,
          options?.headers ? { headers: options.headers } : undefined,
        ),
    },
    get: {
      method: accountEndpoints.get.method,
      path: accountEndpoints.get.path,
      schema: undefined,
      call: (
        params?: Record<string, unknown>,
        options?: { headers?: Record<string, string> },
      ) =>
        client.get<AccountGetResponse>(
          accountEndpoints.get.path,
          params,
          options?.headers ? { headers: options.headers } : undefined,
        ),
    },
    update: {
      method: accountEndpoints.update.method,
      path: accountEndpoints.update.path,
      schema: schemas.account.update,
      call: (
        params: AccountUpdateParams,
        options?: { headers?: Record<string, string> },
      ) =>
        client.put<AccountUpdateResponse>(
          accountEndpoints.update.path,
          params,
          options?.headers ? { headers: options.headers } : undefined,
        ),
    },
    forgotPassword: {
      method: accountEndpoints.forgotPassword.method,
      path: accountEndpoints.forgotPassword.path,
      schema: schemas.account.forgotPassword,
      call: (
        params: AccountForgotPasswordParams,
        options?: { headers?: Record<string, string> },
      ) =>
        client.post<void>(
          accountEndpoints.forgotPassword.path,
          params,
          options?.headers ? { headers: options.headers } : undefined,
        ),
    },
    resetPassword: {
      method: accountEndpoints.resetPassword.method,
      path: accountEndpoints.resetPassword.path,
      schema: schemas.account.resetPassword,
      call: (
        params: AccountResetPasswordParams,
        options?: { headers?: Record<string, string> },
      ) =>
        client.put<void>(
          accountEndpoints.resetPassword.path,
          params,
          options?.headers ? { headers: options.headers } : undefined,
        ),
    },
    verifyEmail: {
      method: accountEndpoints.verifyEmail.method,
      path: accountEndpoints.verifyEmail.path,
      schema: schemas.account.verifyEmail,
      call: (
        params: AccountVerifyEmailParams,
        options?: { headers?: Record<string, string> },
      ) =>
        client.get<void>(
          accountEndpoints.verifyEmail.path,
          params,
          options?.headers ? { headers: options.headers } : undefined,
        ),
    },
    verifyEmailToken: {
      method: accountEndpoints.verifyEmailToken.method,
      path: accountEndpoints.verifyEmailToken.path,
      schema: schemas.account.verifyEmailToken,
      call: (
        params: AccountVerifyEmailTokenParams,
        options?: { headers?: Record<string, string> },
      ) =>
        client.post<AccountVerifyEmailTokenResponse>(
          accountEndpoints.verifyEmailToken.path,
          params,
          options?.headers ? { headers: options.headers } : undefined,
        ),
    },
    verifyResetToken: {
      method: accountEndpoints.verifyResetToken.method,
      path: accountEndpoints.verifyResetToken.path,
      schema: schemas.account.verifyResetToken,
      call: (
        params: AccountVerifyResetTokenParams,
        options?: { headers?: Record<string, string> },
      ) =>
        client.get<void>(
          accountEndpoints.verifyResetToken.path,
          params,
          options?.headers ? { headers: options.headers } : undefined,
        ),
    },
    resendEmail: {
      method: accountEndpoints.resendEmail.method,
      path: accountEndpoints.resendEmail.path,
      schema: schemas.account.resendEmail,
      call: (
        params: AccountResendEmailParams,
        options?: { headers?: Record<string, string> },
      ) =>
        client.post<void>(
          accountEndpoints.resendEmail.path,
          params,
          options?.headers ? { headers: options.headers } : undefined,
        ),
    },
    google: {
      method: accountEndpoints.google.method,
      path: accountEndpoints.google.path,
      schema: undefined,
      call: (
        params?: Record<string, unknown>,
        options?: { headers?: Record<string, string> },
      ) =>
        client.get<void>(
          accountEndpoints.google.path,
          params,
          options?.headers ? { headers: options.headers } : undefined,
        ),
    },
    googleCallback: {
      method: accountEndpoints.googleCallback.method,
      path: accountEndpoints.googleCallback.path,
      schema: undefined,
      call: (
        params?: Record<string, unknown>,
        options?: { headers?: Record<string, string> },
      ) =>
        client.get<void>(
          accountEndpoints.googleCallback.path,
          params,
          options?.headers ? { headers: options.headers } : undefined,
        ),
    },
    googleMobile: {
      method: accountEndpoints.googleMobile.method,
      path: accountEndpoints.googleMobile.path,
      schema: schemas.account.googleMobile,
      call: (
        params: AccountGoogleMobileParams,
        options?: { headers?: Record<string, string> },
      ) =>
        client.post<AccountGoogleMobileResponse>(
          accountEndpoints.googleMobile.path,
          params,
          options?.headers ? { headers: options.headers } : undefined,
        ),
    },
  };
}

function createUsersEndpoints(client: ApiClient) {
  return {
    list: {
      method: usersEndpoints.list.method,
      path: usersEndpoints.list.path,
      schema: schemas.users.list,
      call: (
        params: UsersListParams,
        options?: { headers?: Record<string, string> },
      ) =>
        client.get<UsersListResponse>(
          usersEndpoints.list.path,
          params,
          options?.headers ? { headers: options.headers } : undefined,
        ),
    },
    update: {
      method: usersEndpoints.update.method,
      path: usersEndpoints.update.path,
      schema: schemas.users.update,
      call: (
        params: UsersUpdateParams,
        options: {
          pathParams: UsersUpdatePathParams;
          headers?: Record<string, string>;
        },
      ) =>
        client.put<UsersUpdateResponse>(
          `/users/${options.pathParams.id}`,
          params,
          options.headers ? { headers: options.headers } : undefined,
        ),
    },
    remove: {
      method: usersEndpoints.remove.method,
      path: usersEndpoints.remove.path,
      schema: undefined,
      call: (
        params: Record<string, unknown> | undefined,
        options: {
          pathParams: UsersRemovePathParams;
          headers?: Record<string, string>;
        },
      ) =>
        client.delete<void>(
          `/users/${options.pathParams.id}`,
          params,
          options.headers ? { headers: options.headers } : undefined,
        ),
    },
  };
}

export function createApiEndpoints(client: ApiClient) {
  return {
    account: createAccountEndpoints(client),
    users: createUsersEndpoints(client),
  };
}

// ─── Utility Types ──────────────────────────────────────────────────────

export type ApiEndpoints = ReturnType<typeof createApiEndpoints>;

export interface ApiEndpoint<
  TParams = unknown,
  TPathParams = never,
  TResponse = unknown,
> {
  method: "get" | "post" | "put" | "patch" | "delete";
  path: string;
  schema: z.ZodType | undefined;
  call: TPathParams extends never
    ? (
        params: TParams,
        options?: { headers?: Record<string, string> },
      ) => Promise<TResponse>
    : (
        params: TParams,
        options: {
          pathParams: TPathParams;
          headers?: Record<string, string>;
        },
      ) => Promise<TResponse>;
}

export type InferParams<T> =
  T extends { schema: infer S }
    ? S extends z.ZodType
      ? z.infer<S>
      : Record<string, unknown>
    : Record<string, unknown>;

export type InferPathParams<T> =
  T extends {
    call: (
      params: unknown,
      options: { pathParams: infer PP },
    ) => unknown;
  }
    ? PP
    : never;

export type InferResponse<T> =
  T extends { call: (...args: never[]) => Promise<infer R> } ? R : unknown;
