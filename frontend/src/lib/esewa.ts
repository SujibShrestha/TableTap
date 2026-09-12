/**
 * Redirects the browser to eSewa's hosted payment page via a real HTML form POST.
 *
 * This is NOT a fetch/XHR call — eSewa requires an actual full-page form submission.
 * The browser navigates away from the current page, so this function does not return
 * a meaningful value and cannot be awaited for a response.
 */
export function redirectToEsewa(esewa: {
  paymentUrl: string;
  fields: Record<string, string>;
}): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = esewa.paymentUrl;
  form.style.display = "none";

  for (const [key, value] of Object.entries(esewa.fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}
