/**
 * State Management Utilities
 * Standardized patterns for state management, type safety, and state validation
 */

import React, { useCallback, useRef, useEffect } from 'react';

/**
 * State validation result
 */
export interface StateValidationResult<T> {
  valid: boolean;
  data?: T;
  errors: string[];
}

/**
 * State validator function
 */
export type StateValidator<T> = (value: T) => { valid: boolean; errors: string[] };

/**
 * Create a validated state hook
 */
export function useValidatedState<T>(
  initialValue: T,
  validator?: StateValidator<T>
): [T, (value: T) => boolean, StateValidationResult<T>] {
  const [state, setState] = React.useState<T>(initialValue);
  const [validation, setValidation] = React.useState<StateValidationResult<T>>({
    valid: true,
    data: initialValue,
    errors: [],
  });

  const setValidatedState = useCallback(
    (value: T): boolean => {
      if (validator) {
        const result = validator(value);
        setValidation({
          valid: result.valid,
          data: result.valid ? value : undefined,
          errors: result.errors,
        });
        
        if (result.valid) {
          setState(value);
          return true;
        }
        return false;
      }
      
      setState(value);
      setValidation({ valid: true, data: value, errors: [] });
      return true;
    },
    [validator]
  );

  return [state, setValidatedState, validation];
}

/**
 * Create a debounced state hook
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number
): [T, T, (value: T) => void] {
  const [state, setState] = React.useState<T>(initialValue);
  const [debouncedState, setDebouncedState] = React.useState<T>(initialValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setValue = useCallback(
    (value: T) => {
      setState(value);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setDebouncedState(value);
        timeoutRef.current = null;
      }, delay);
    },
    [delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, debouncedState, setValue];
}

/**
 * Create a persisted state hook
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T,
  options: {
    storage?: Storage;
    serializer?: (value: T) => string;
    deserializer?: (value: string) => T;
    validator?: StateValidator<T>;
  } = {}
): [T, (value: T) => void] {
  const {
    storage = typeof window !== 'undefined' ? localStorage : undefined,
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    validator,
  } = options;

  const [state, setState] = React.useState<T>(() => {
    if (!storage) {
      return initialValue;
    }

    try {
      const item = storage.getItem(key);
      if (item === null) {
        return initialValue;
      }

      const parsed = deserializer(item) as T;
      
      if (validator) {
        const validation = validator(parsed);
        if (!validation.valid) {
          return initialValue;
        }
      }

      return parsed;
    } catch {
      // Silently return initial value on parse error
      // In production, consider logging this for debugging
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      try {
        // Validate if validator provided
        if (validator) {
          const validation = validator(value);
          if (!validation.valid) {
            return;
          }
        }

        setState(value);

        if (storage) {
          storage.setItem(key, serializer(value));
        }
      } catch {
        // Silently fail if storage is unavailable
      }
    },
    [key, storage, serializer, validator]
  );

  return [state, setValue];
}

/**
 * Create a state machine hook
 */
export interface StateMachineConfig<TState extends string, TEvent extends string> {
  initialState: TState;
  states: Record<TState, {
    on?: Partial<Record<TEvent, TState>>;
    entry?: () => void;
    exit?: () => void;
  }>;
};

export function useStateMachine<TState extends string, TEvent extends string>(
  config: StateMachineConfig<TState, TEvent>
): [TState, (event: TEvent) => boolean] {
  const [currentState, setCurrentState] = React.useState<TState>(config.initialState);

  const send = useCallback(
    (event: TEvent): boolean => {
      const currentStateConfig = config.states[currentState];
      const nextState = currentStateConfig?.on?.[event];

      if (nextState) {
        // Exit current state
        currentStateConfig.exit?.();

        // Enter next state
        setCurrentState(nextState);
        config.states[nextState]?.entry?.();

        return true;
      }

      return false;
    },
    [currentState, config]
  );

  return [currentState, send];
}

/**
 * Create a reducer with type safety
 */
export interface ReducerAction<TType extends string, TPayload = unknown> {
  type: TType;
  payload?: TPayload;
};

export function createTypedReducer<TState, TAction extends ReducerAction<string>>(
  reducer: (state: TState, action: TAction) => TState,
  initialState: TState
): [TState, React.Dispatch<TAction>] {
  return React.useReducer(reducer, initialState);
}

/**
 * Create a selector hook for derived state
 */
export function useDerivedState<T, U>(
  source: T,
  selector: (value: T) => U,
  deps?: React.DependencyList
): U {
  return React.useMemo(() => selector(source), [source, ...(deps ?? [])]);
}

/**
 * Create a state subscription hook
 */
export function useStateSubscription<T>(
  getState: () => T,
  subscribe: (callback: () => void) => () => void,
  selector?: (state: T) => T
): T {
  const [state, setState] = React.useState<T>(() => {
    const current = getState();
    return selector ? selector(current) : current;
  });

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      const current = getState();
      setState(selector ? selector(current) : current);
    });

    return unsubscribe;
  }, [getState, subscribe, selector]);

  return state;
}

/**
 * Validate state shape
 */
export function validateStateShape<T>(
  value: unknown,
  schema: {
    required?: string[];
    type?: 'object' | 'array';
    properties?: Record<string, (value: unknown) => boolean>;
  }
): StateValidationResult<T> {
  const errors: string[] = [];

  if (schema.type === 'object' && !(typeof value === 'object' && value !== null && !Array.isArray(value))) {
    errors.push('State must be an object');
    return { valid: false, errors };
  }

  if (schema.type === 'array' && !Array.isArray(value)) {
    errors.push('State must be an array');
    return { valid: false, errors };
  }

  if (schema.required && typeof value === 'object' && value !== null) {
    for (const field of schema.required) {
      if (!(field in value)) {
        errors.push(`Required field '${field}' is missing`);
      }
    }
  }

  if (schema.properties && typeof value === 'object' && value !== null) {
    for (const [field, validator] of Object.entries(schema.properties)) {
      const fieldValue = (value as Record<string, unknown>)[field];
      if (fieldValue !== undefined && !validator(fieldValue)) {
        errors.push(`Field '${field}' failed validation`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    data: value as T,
    errors,
  };
}

/**
 * Create state snapshot utility
 */
export function createStateSnapshot<T>(state: T): {
  state: T;
  timestamp: number;
  version: string;
} {
  return {
    state,
    timestamp: Date.now(),
    version: '1.0.0',
  };
}

/**
 * Restore state from snapshot
 */
export function restoreStateFromSnapshot<T>(
  snapshot: { state: T; timestamp: number; version: string },
  validator?: StateValidator<T>
): { valid: boolean; state?: T; errors: string[] } {
  if (validator) {
    const validation = validator(snapshot.state);
    return {
      valid: validation.valid,
      state: validation.valid ? snapshot.state : undefined,
      errors: validation.errors,
    };
  }

  return {
    valid: true,
    state: snapshot.state,
    errors: [],
  };
}

