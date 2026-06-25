import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[18px] [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-blue focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
  {
    variants: {
      variant: {
        primary: "bg-civic-blue text-white hover:bg-civic-blue-hover",
        secondary: "border border-civic-line bg-white text-ink hover:bg-paper-deep",
        outline: "border border-ink/80 bg-transparent text-ink hover:bg-ink hover:text-white",
        tertiary: "px-0 text-civic-blue underline-offset-4 hover:underline",
        destructive: "text-community-red hover:bg-community-red-soft",
        ghost: "text-ink hover:bg-paper-deep",
        accent: "bg-field-green text-white hover:bg-field-green-hover",
        urgent: "bg-community-red text-white hover:opacity-90",
      },
      size: {
        default: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-[15px]",
        sm: "h-9 px-3 text-sm",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
  }
);
Button.displayName = "Button";

export { buttonVariants };
