import { toast } from "sonner";
import type { ReactNode } from "react";

// Types for our toast service
type ToastType = "success" | "error" | "warning" | "info" | "loading";
type ToastPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center";
type ToastGroup = "auth" | "network" | "user" | "system" | "custom"; // Add toast grouping support

// Toast configuration interface
interface ToastConfig {
  message: string;
  description?: string;
  duration?: number;
  position?: ToastPosition;
  dismissible?: boolean;
  action?: ReactNode;
  group?: ToastGroup; // Add group support
  id?: string; // Add id support for grouping
  persistent?: boolean; // Add persistent support for critical messages
}

// Centralized toast service
class ToastService {
  private defaultDuration = 5000;
  private defaultPosition: ToastPosition = "bottom-right";
  private toastGroups: Map<string, string[]> = new Map(); // Track grouped toasts
  private persistentToasts: Set<string> = new Set(); // Track persistent toasts

  // Success toast
  success(config: ToastConfig | string) {
    const toastConfig = typeof config === "string" ? { message: config } : config;
    
    // Handle grouping
    if (toastConfig.group && toastConfig.id) {
      this.handleGrouping(toastConfig.group, toastConfig.id);
    }
    
    // Handle persistence
    const toastId = toastConfig.id || Math.random().toString(36).substr(2, 9);
    if (toastConfig.persistent) {
      this.persistentToasts.add(toastId);
    }
    
    return toast.success(toastConfig.message, {
      description: toastConfig.description,
      duration: toastConfig.persistent ? Infinity : (toastConfig.duration ?? this.defaultDuration),
      position: toastConfig.position ?? this.defaultPosition,
      dismissible: toastConfig.dismissible ?? true,
      action: toastConfig.action,
      id: toastId,
    });
  }

  // Error toast
  error(config: ToastConfig | string) {
    const toastConfig = typeof config === "string" ? { message: config } : config;
    
    // Handle grouping
    if (toastConfig.group && toastConfig.id) {
      this.handleGrouping(toastConfig.group, toastConfig.id);
    }
    
    // Handle persistence
    const toastId = toastConfig.id || Math.random().toString(36).substr(2, 9);
    if (toastConfig.persistent) {
      this.persistentToasts.add(toastId);
    }
    
    return toast.error(toastConfig.message, {
      description: toastConfig.description,
      duration: toastConfig.persistent ? Infinity : (toastConfig.duration ?? this.defaultDuration),
      position: toastConfig.position ?? this.defaultPosition,
      dismissible: toastConfig.dismissible ?? true,
      action: toastConfig.action,
      id: toastId,
    });
  }

  // Warning toast
  warning(config: ToastConfig | string) {
    const toastConfig = typeof config === "string" ? { message: config } : config;
    
    // Handle grouping
    if (toastConfig.group && toastConfig.id) {
      this.handleGrouping(toastConfig.group, toastConfig.id);
    }
    
    // Handle persistence
    const toastId = toastConfig.id || Math.random().toString(36).substr(2, 9);
    if (toastConfig.persistent) {
      this.persistentToasts.add(toastId);
    }
    
    return toast.warning(toastConfig.message, {
      description: toastConfig.description,
      duration: toastConfig.persistent ? Infinity : (toastConfig.duration ?? this.defaultDuration),
      position: toastConfig.position ?? this.defaultPosition,
      dismissible: toastConfig.dismissible ?? true,
      action: toastConfig.action,
      id: toastId,
    });
  }

  // Info toast
  info(config: ToastConfig | string) {
    const toastConfig = typeof config === "string" ? { message: config } : config;
    
    // Handle grouping
    if (toastConfig.group && toastConfig.id) {
      this.handleGrouping(toastConfig.group, toastConfig.id);
    }
    
    // Handle persistence
    const toastId = toastConfig.id || Math.random().toString(36).substr(2, 9);
    if (toastConfig.persistent) {
      this.persistentToasts.add(toastId);
    }
    
    return toast.info(toastConfig.message, {
      description: toastConfig.description,
      duration: toastConfig.persistent ? Infinity : (toastConfig.duration ?? this.defaultDuration),
      position: toastConfig.position ?? this.defaultPosition,
      dismissible: toastConfig.dismissible ?? true,
      action: toastConfig.action,
      id: toastId,
    });
  }

  // Loading toast
  loading(config: ToastConfig | string) {
    const toastConfig = typeof config === "string" ? { message: config } : config;
    
    // Handle grouping
    if (toastConfig.group && toastConfig.id) {
      this.handleGrouping(toastConfig.group, toastConfig.id);
    }
    
    // Handle persistence
    const toastId = toastConfig.id || Math.random().toString(36).substr(2, 9);
    if (toastConfig.persistent) {
      this.persistentToasts.add(toastId);
    }
    
    return toast.loading(toastConfig.message, {
      description: toastConfig.description,
      duration: toastConfig.persistent ? Infinity : (toastConfig.duration ?? this.defaultDuration),
      position: toastConfig.position ?? this.defaultPosition,
      dismissible: toastConfig.dismissible ?? true,
      action: toastConfig.action,
      id: toastId,
    });
  }

  // Handle grouping logic
  private handleGrouping(group: string, id: string) {
    if (!this.toastGroups.has(group)) {
      this.toastGroups.set(group, []);
    }
    
    const groupToasts = this.toastGroups.get(group)!;
    
    // If this is not the first toast in the group, dismiss the previous one
    if (groupToasts.length > 0) {
      const previousToastId = groupToasts[groupToasts.length - 1];
      // Don't dismiss persistent toasts
      if (!this.persistentToasts.has(previousToastId)) {
        toast.dismiss(previousToastId);
      }
    }
    
    // Add the new toast to the group
    groupToasts.push(id);
    
    // Keep only the last 3 toasts in each group to prevent memory issues
    if (groupToasts.length > 3) {
      groupToasts.shift();
    }
  }

  // Dismiss a specific toast
  dismiss(toastId?: string | number) {
    if (toastId) {
      this.persistentToasts.delete(toastId.toString());
    }
    toast.dismiss(toastId);
  }

  // Dismiss all toasts
  dismissAll() {
    toast.dismiss();
    this.toastGroups.clear();
    this.persistentToasts.clear();
  }

  // Dismiss all toasts in a specific group
  dismissGroup(group: string) {
    if (this.toastGroups.has(group)) {
      const groupToasts = this.toastGroups.get(group)!;
      groupToasts.forEach(toastId => {
        this.persistentToasts.delete(toastId);
        toast.dismiss(toastId);
      });
      this.toastGroups.delete(group);
    }
  }

  // Dismiss all non-persistent toasts
  dismissNonPersistent() {
    // Get all toast IDs and dismiss those that aren't persistent
    // Note: This is a simplified approach since we can't easily get all active toast IDs
    // In practice, you might want to track all toast IDs separately
    toast.dismiss();
    
    // Re-show persistent toasts
    // This would require storing the full toast config for each persistent toast
    // For now, we'll just clear the groups but keep persistent toast IDs
    this.toastGroups.clear();
  }

  // Promise-based toast (useful for async operations)
  promise<T>(
    promise: Promise<T>,
    options: {
      loading: string | ToastConfig;
      success: string | ToastConfig | ((data: T) => string | ToastConfig);
      error: string | ToastConfig | ((error: any) => string | ToastConfig);
    }
  ) {
    // Extract configs
    const loadingConfig = typeof options.loading === "string" ? { message: options.loading } : options.loading;
    
    // Handle persistence for loading toast
    const loadingToastId = loadingConfig.id || Math.random().toString(36).substr(2, 9);
    if (loadingConfig.persistent) {
      this.persistentToasts.add(loadingToastId);
    }
    
    // Show a regular toast for loading with appropriate duration
    const loadingToastIdActual = toast.loading(typeof options.loading === "string" ? options.loading : options.loading.message, {
      duration: loadingConfig.persistent ? Infinity : (loadingConfig.duration ?? this.defaultDuration),
      position: loadingConfig.position ?? this.defaultPosition,
      dismissible: loadingConfig.dismissible ?? true,
      id: loadingToastId,
    });
    
    // Track the actual toast ID if different
    if (loadingToastIdActual && loadingToastIdActual !== loadingToastId) {
      if (loadingConfig.persistent) {
        this.persistentToasts.delete(loadingToastId);
        this.persistentToasts.add(loadingToastIdActual.toString());
      }
    }
    
    return promise.then(
      (data) => {
        // Remove loading toast from persistent tracking if it wasn't meant to persist
        if (!loadingConfig.persistent) {
          this.persistentToasts.delete(loadingToastId);
          if (loadingToastIdActual && loadingToastIdActual !== loadingToastId) {
            this.persistentToasts.delete(loadingToastIdActual.toString());
          }
        }
        
        if (typeof options.success === "function") {
          const result = options.success(data);
          const successMessage = typeof result === "string" ? result : result.message;
          
          // Handle persistence for success toast
          const successConfig = typeof result === "string" ? { message: result } : result;
          const successToastId = successConfig.id || Math.random().toString(36).substr(2, 9);
          if (successConfig.persistent) {
            this.persistentToasts.add(successToastId);
          }
          
          return toast.success(successMessage, {
            duration: successConfig.persistent ? Infinity : (successConfig.duration ?? this.defaultDuration),
            position: successConfig.position ?? this.defaultPosition,
            dismissible: successConfig.dismissible ?? true,
            id: successToastId,
          });
        }
        
        const successMessage = typeof options.success === "string" ? options.success : options.success.message;
        const successConfig = typeof options.success === "string" ? { message: options.success } : options.success;
        
        // Handle persistence for success toast
        const successToastId = successConfig.id || Math.random().toString(36).substr(2, 9);
        if (successConfig.persistent) {
          this.persistentToasts.add(successToastId);
        }
        
        return toast.success(successMessage, {
          duration: successConfig.persistent ? Infinity : (successConfig.duration ?? this.defaultDuration),
          position: successConfig.position ?? this.defaultPosition,
          dismissible: successConfig.dismissible ?? true,
          id: successToastId,
        });
      },
      (error) => {
        // Remove loading toast from persistent tracking if it wasn't meant to persist
        if (!loadingConfig.persistent) {
          this.persistentToasts.delete(loadingToastId);
          if (loadingToastIdActual && loadingToastIdActual !== loadingToastId) {
            this.persistentToasts.delete(loadingToastIdActual.toString());
          }
        }
        
        if (typeof options.error === "function") {
          const result = options.error(error);
          const errorMessage = typeof result === "string" ? result : result.message;
          
          // Handle persistence for error toast
          const errorConfig = typeof result === "string" ? { message: result } : result;
          const errorToastId = errorConfig.id || Math.random().toString(36).substr(2, 9);
          if (errorConfig.persistent) {
            this.persistentToasts.add(errorToastId);
          }
          
          return toast.error(errorMessage, {
            duration: errorConfig.persistent ? Infinity : (errorConfig.duration ?? this.defaultDuration),
            position: errorConfig.position ?? this.defaultPosition,
            dismissible: errorConfig.dismissible ?? true,
            id: errorToastId,
          });
        }
        
        const errorMessage = typeof options.error === "string" ? options.error : options.error.message;
        const errorConfig = typeof options.error === "string" ? { message: options.error } : options.error;
        
        // Handle persistence for error toast
        const errorToastId = errorConfig.id || Math.random().toString(36).substr(2, 9);
        if (errorConfig.persistent) {
          this.persistentToasts.add(errorToastId);
        }
        
        return toast.error(errorMessage, {
          duration: errorConfig.persistent ? Infinity : (errorConfig.duration ?? this.defaultDuration),
          position: errorConfig.position ?? this.defaultPosition,
          dismissible: errorConfig.dismissible ?? true,
          id: errorToastId,
        });
      }
    );
  }
  
  // Method to update default duration
  setDefaultDuration(duration: number) {
    this.defaultDuration = duration;
  }
  
  // Method to get default duration
  getDefaultDuration(): number {
    return this.defaultDuration;
  }
}

// Export a singleton instance
export const toastService = new ToastService();

// Export the toast types for convenience
export type { ToastType, ToastConfig, ToastPosition, ToastGroup };