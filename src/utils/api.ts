export async function handleResponse(res: Response) {
  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      errorMessage = data.error || errorMessage;
    } catch (e) {
      // Ignore JSON parsing errors
    }
    throw new Error(errorMessage);
  }
  return res.json();
}
