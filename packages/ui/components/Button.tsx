import * as React from "react";

type ButtonVariant = "default" | "destructive" | "outline" | "ghost" | "link";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline:
    "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 rounded-md px-3 text-xs",
  md: "h-10 rounded-md px-4 py-2 text-sm",
  lg: "h-11 rounded-md px-8 text-base",
  icon: "h-10 w-10 rounded-md",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "default",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      className = "",
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  },
);

Button.displayName = "Button";
