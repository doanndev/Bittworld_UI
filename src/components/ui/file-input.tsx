"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";

interface FileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  accept?: string;
  id?: string;
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ className, placeholder, onChange, accept, id, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleClick = () => {
      inputRef.current?.click();
    };

    return (
      <div className="relative">
        <input
          ref={(node) => {
            // Handle both refs
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
            inputRef.current = node;
          }}
          type="file"
          className="hidden"
          onChange={onChange}
          accept={accept}
          id={id}
          {...props}
        />
        <div
          onClick={handleClick}
          className={cn(
            "flex items-center justify-center px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-theme-primary-500 focus:border-transparent cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors",
            className
          )}
        >
          <Upload className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
          <span className="text-gray-500 dark:text-gray-400">
            {placeholder || "Choose file"}
          </span>
        </div>
      </div>
    );
  }
);

FileInput.displayName = "FileInput";

export { FileInput };
