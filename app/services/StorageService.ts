/**
 * Service for managing localStorage operations
 */
export class StorageService {
  /**
   * Prefix applied to every key. Public because code that must read storage
   * without loading this module — e.g. the blocking theme script inlined into
   * <head> in root.tsx — needs to build the same prefixed key.
   */
  public static readonly KEY_PREFIX = "v2-";

  /**
   * Adds the v2- prefix to the key
   *
   * @param key - The original key
   * @returns The prefixed key
   */
  private static getPrefixedKey(key: string): string {
    return `${this.KEY_PREFIX}${key}`;
  }

  /**
   * Sets a value in localStorage
   *
   * @param key - The key to store the value under
   * @param value - The value to store (will be stringified if not a string)
   * @returns void
   */
  public static set(key: string, value: any): void {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const serializedValue =
        typeof value === "string" ? value : JSON.stringify(value);
      localStorage.setItem(prefixedKey, serializedValue);
    } catch (error) {
      console.error(
        `Error setting localStorage item with key "${key}":`,
        error
      );
      throw error;
    }
  }

  /**
   * Updates a value in localStorage (merges with existing data if it's an object)
   *
   * @param key - The key of the item to update
   * @param value - The new value or partial object to merge
   * @returns void
   */
  public static update(key: string, value: any): void {
    try {
      const existingValue = this.get(key);

      if (existingValue === null) {
        // If no existing value, just set the new value
        this.set(key, value);
        return;
      }

      if (
        typeof value === "object" &&
        value !== null &&
        typeof existingValue === "object" &&
        existingValue !== null
      ) {
        // Merge objects
        const mergedValue = { ...existingValue, ...value };
        this.set(key, mergedValue);
      } else {
        // Replace with new value
        this.set(key, value);
      }
    } catch (error) {
      console.error(
        `Error updating localStorage item with key "${key}":`,
        error
      );
      throw error;
    }
  }

  /**
   * Gets a value from localStorage
   *
   * @param key - The key to retrieve
   * @returns The parsed value or null if not found
   */
  public static get<T = any>(key: string): T | null {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const item = localStorage.getItem(prefixedKey);

      if (item === null) {
        return null;
      }

      try {
        // Try to parse as JSON
        return JSON.parse(item) as T;
      } catch {
        // If parsing fails, return as string
        return item as unknown as T;
      }
    } catch (error) {
      console.error(
        `Error getting localStorage item with key "${key}":`,
        error
      );
      return null;
    }
  }

  /**
   * Removes a value from localStorage
   *
   * @param key - The key to remove
   * @returns void
   */
  public static remove(key: string): void {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      localStorage.removeItem(prefixedKey);
    } catch (error) {
      console.error(
        `Error removing localStorage item with key "${key}":`,
        error
      );
      throw error;
    }
  }

  /**
   * Clears all items from localStorage
   *
   * @returns void
   */
  public static clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Error clearing localStorage:", error);
      throw error;
    }
  }

  /**
   * Checks if a key exists in localStorage
   *
   * @param key - The key to check
   * @returns boolean indicating if the key exists
   */
  public static has(key: string): boolean {
    const prefixedKey = this.getPrefixedKey(key);
    return localStorage.getItem(prefixedKey) !== null;
  }
}

export default StorageService;
