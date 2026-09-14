export async function copyEmail(
  email: string,
  clipboard?: Pick<Clipboard, 'writeText'>
): Promise<boolean> {
  try {
    if (!clipboard?.writeText) return false;
    await clipboard.writeText(email);
    return true;
  } catch {
    return false;
  }
}
