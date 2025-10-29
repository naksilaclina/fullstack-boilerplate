import { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        success:
          "border-success/50 text-success dark:border-success [&>svg]:text-success",
        warning:
          "border-warning/50 text-warning dark:border-warning [&>svg]:text-warning",
        info:
          "border-info/50 text-info dark:border-info [&>svg]:text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const alertTitleVariants = cva("mb-1 font-medium leading-none tracking-tight", {
  variants: {
    variant: {
      default: "text-foreground",
      destructive: "text-destructive",
      success: "text-success",
      warning: "text-warning",
      info: "text-info",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const alertDescriptionVariants = cva("text-sm [&_p]:leading-relaxed", {
  variants: {
    variant: {
      default: "text-muted-foreground",
      destructive: "text-destructive/80",
      success: "text-success/80",
      warning: "text-warning/80",
      info: "text-info/80",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
}

const Alert = ({ className, variant, children, ...props }: AlertProps) => {
  return (
    <div
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {children}
    </div>
  );
};

interface AlertTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof alertTitleVariants> {}

const AlertTitle = ({ className, variant, ...props }: AlertTitleProps) => (
  <h5
    className={cn(alertTitleVariants({ variant }), className)}
    {...props}
  />
);

interface AlertDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof alertDescriptionVariants> {}

const AlertDescription = ({
  className,
  variant,
  ...props
}: AlertDescriptionProps) => (
  <div
    className={cn(alertDescriptionVariants({ variant }), className)}
    {...props}
  />
);

export { Alert, AlertTitle, AlertDescription };