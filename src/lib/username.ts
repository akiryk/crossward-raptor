// Story 14-S1. The sign-in form's rules, shared by the form and the auth hook
// that captures an account's first username. Each returns the message to
// show, or null when the trimmed value is acceptable.

export function usernameError(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') {
    return 'Oops! You need to add a username.';
  }
  if (Array.from(value.trim()).length > 80) {
    return 'Oops! Use 80 characters or fewer.';
  }
  return null;
}

export function emailError(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') {
    return 'Oops! You need to add an email address.';
  }
  const email = value.trim();
  const parts = email.split('@');
  const [local, domain] = parts;
  const wellFormed =
    !/\s/.test(email) &&
    parts.length === 2 &&
    local !== '' &&
    domain.includes('.') &&
    !domain.startsWith('.') &&
    !domain.endsWith('.');
  return wellFormed ? null : "Oops! That doesn't look like an email address.";
}
