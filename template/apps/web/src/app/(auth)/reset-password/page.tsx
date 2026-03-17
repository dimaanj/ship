'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useApiMutation } from 'hooks';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { schemas } from 'shared';
import { z } from 'zod';

import { apiClient } from 'services/api-client.service';
import { handleApiError } from 'utils';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';

const formSchema = schemas.account.resetPassword.omit({ token: true });

type ResetPasswordFormData = z.infer<typeof formSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({ resolver: zodResolver(formSchema) });

  const {
    mutate: resetPassword,
    isPending: isResetPasswordPending,
    isSuccess: isResetPasswordSuccess,
  } = useApiMutation(apiClient.account.resetPassword);

  const onSubmit = (data: ResetPasswordFormData) => {
    if (typeof token !== 'string') return;

    resetPassword(
      {
        ...data,
        token,
      },
      {
        onError: (e) => handleApiError(e),
      },
    );
  };

  if (!token) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-2">
        <h2 className="mb-0 text-2xl font-semibold">Invalid token</h2>
        <p className="m-0 text-muted-foreground">Sorry, your token is invalid.</p>
      </div>
    );
  }

  if (isResetPasswordSuccess) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-4">
        <h2 className="text-2xl font-semibold">Password has been updated</h2>

        <p className="mt-0 text-muted-foreground">
          Your password has been updated successfully. You can now use your new password to sign in.
        </p>

        <Button onClick={() => router.push('/sign-in')}>Back to Sign In</Button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <h2 className="text-2xl font-semibold">Reset Password</h2>

      <p className="mt-0 text-muted-foreground">Please choose your new password</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              {...register('password')}
              id="password"
              placeholder="Enter your new password"
              className={errors.password ? 'border-destructive' : ''}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <Button type="submit" disabled={isResetPasswordPending}>
            {isResetPasswordPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save New Password
          </Button>
        </div>
      </form>
    </div>
  );
}
