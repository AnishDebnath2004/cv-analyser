/**
 * Safe fetch helper that handles non-JSON / HTML / plain-text server error responses (e.g. Vercel 500 or offline backend)
 * without crashing with "Unexpected token 'A', 'A server e'... is not valid JSON".
 */
export async function safeFetchJson(url, options = {}, fallbackErrorMsg = 'Request failed') {
  let res;
  try {
    res = await fetch(url, options);
  } catch (netErr) {
    throw new Error('Network error: Unable to connect to the backend server. Please verify the server is running.');
  }

  // Read response body as text once to avoid locked stream errors
  let rawText = '';
  try {
    rawText = await res.text();
  } catch {
    rawText = '';
  }

  let data = null;
  if (rawText && rawText.trim().length > 0) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    // 1. Structured JSON error detail from backend
    const detail = data?.detail || (typeof data === 'string' ? data : null);
    if (detail) {
      const err = new Error(detail);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    // 2. Short plain-text message from server (if not HTML error document)
    if (
      rawText &&
      rawText.trim().length > 0 &&
      rawText.length < 250 &&
      !rawText.includes('<html') &&
      !rawText.includes('<!DOCTYPE')
    ) {
      const err = new Error(rawText.trim());
      err.status = res.status;
      throw err;
    }

    // 3. Status-specific clear messages
    let msg = fallbackErrorMsg;
    if (res.status === 401) {
      msg = 'Authentication required or session expired. Please log in again.';
    } else if (res.status === 403) {
      msg = 'Access denied or quota limit reached.';
    } else if (res.status === 404) {
      msg = 'The requested service was not found on the server (404).';
    } else if (res.status === 429) {
      msg = 'Too many requests. Please slow down and try again shortly.';
    } else if (res.status >= 500) {
      msg = 'A server error occurred. Please verify that the backend server is running and try again.';
    } else {
      msg = `${fallbackErrorMsg} (Server returned status ${res.status})`;
    }

    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  return data !== null ? data : {};
}
