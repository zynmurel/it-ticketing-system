"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Role, type LoginResponse } from "@it-ticketing/shared";
import { Controller, useForm, type DefaultValues } from "react-hook-form";
import { apiFetch, ApiError } from "@/lib/api";
import { saveSession } from "@/lib/auth-storage";
import { registerSchema, type RegisterFormValues } from "@/lib/register-schema";
import { roleOptions } from "@/lib/role-labels";
import { RoleOption } from "@/components/auth/role-option";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Department = { id: string; name: string; slug: string };

type RegisterDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (session: LoginResponse) => void;
  onSwitchToLogin?: () => void;
};

const defaultValues: DefaultValues<RegisterFormValues> = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  departmentId: "",
  role: undefined,
};

export function RegisterDialog({
  open,
  onOpenChange,
  onSuccess,
  onSwitchToLogin,
}: RegisterDialogProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues,
  });

  const departmentItems = useMemo(
    () => departments.map((d) => ({ label: d.name, value: d.id })),
    [departments],
  );

  useEffect(() => {
    if (!open) {
      reset(defaultValues);
      setApiError(null);
      return;
    }

    apiFetch<{ departments: Department[] }>("/departments")
      .then((data) => setDepartments(data.departments))
      .catch(() =>
        setApiError("Could not load departments. Is the API running?"),
      );
  }, [open, reset]);

  async function onSubmit(values: RegisterFormValues) {
    setApiError(null);

    try {
      const session = await apiFetch<LoginResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role,
          departmentId: values.departmentId,
        }),
      });
      saveSession(session);
      onSuccess?.(session);
      onOpenChange(false);
      reset(defaultValues);
    } catch (err) {
      setApiError(
        err instanceof ApiError
          ? err.message
          : "Registration failed. Please try again.",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create account</DialogTitle>
          <DialogDescription>
            Register as a requester or support agent. Everyone belongs to one
            department.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className=" grid gap-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="register-name">Full name</Label>
              <Input
                id="register-name"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              {errors.name ? (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="register-email">Email</Label>
              <Input
                id="register-email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="register-password">Password</Label>
              <Input
                id="register-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              {errors.password ? (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="register-confirm-password">
                Confirm password
              </Label>
              <Input
                id="register-confirm-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword ? (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="register-department">Home department</Label>
              <Controller
                name="departmentId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || null}
                    onValueChange={(value) => field.onChange(value ?? "")}
                    items={departmentItems}
                  >
                    <SelectTrigger
                      id="register-department"
                      className="w-full"
                      aria-invalid={!!errors.departmentId}
                    >
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className={"rounded-lg px-2 py-1 max-h-[500px] min-h-[100px]"}>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.departmentId ? (
                <p className="text-sm text-destructive">
                  {errors.departmentId.message}
                </p>
              ) : null}
            </div>

            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">
                I am registering as
              </legend>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <div className="grid gap-2">
                    {roleOptions.map((option) => (
                      <RoleOption
                        key={option.value}
                        title={option.title}
                        description={option.description}
                        value={option.value}
                        selected={field.value === option.value}
                        onSelect={field.onChange}
                      />
                    ))}
                  </div>
                )}
              />
              {errors.role ? (
                <p className="text-sm text-destructive">
                  {errors.role.message}
                </p>
              ) : null}
            </fieldset>

            {apiError ? (
              <p className="text-sm text-destructive" role="alert">
                {apiError}
              </p>
            ) : null}
          </div>

          <DialogFooter className="px-0 pb-4 ">
            <div className=" w-full flex items-center justify-center">
              <Button
                type="submit"
                className="w-full sm:w-auto px-20 py-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating account…" : "Create account"}
              </Button>
            </div>
          </DialogFooter>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            type="button"
            className="font-medium text-primary underline-offset-4 hover:underline"
            onClick={onSwitchToLogin}
          >
            Sign in
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
}
