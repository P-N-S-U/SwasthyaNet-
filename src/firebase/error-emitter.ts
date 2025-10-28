import { EventEmitter } from 'events';
import { FirestorePermissionError } from './errors';

type AppEvents = {
  'permission-error': (error: FirestorePermissionError) => void;
};

// We need to declare the `on` and `off` methods with the correct types
// to get proper type checking and intellisense.
declare interface AppEventEmitter {
  on<T extends keyof AppEvents>(event: T, listener: AppEvents[T]): this;
  off<T extends keyof AppEvents>(event: T, listener: AppEvents[T]): this;
  emit<T extends keyof AppEvents>(
    event: T,
    ...args: Parameters<AppEvents[T]>
  ): boolean;
}

class AppEventEmitter extends EventEmitter {}

export const errorEmitter = new AppEventEmitter();
