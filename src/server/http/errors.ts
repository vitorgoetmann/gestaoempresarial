export function errorPayload(message: string, code = "BAD_REQUEST") {
  return { error: message, code };
}
