export function displayNameValidationMessage(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') {
    return 'Enter a builder name.';
  }
  if (Array.from(value.trim()).length > 80) {
    return 'Use 80 characters or fewer for your builder name.';
  }
  return null;
}
