export async function uploadWorkbookAPI(base64File) {
  const res = await fetch("http://localhost:5001/api/v1/import/workbook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file: base64File })
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return await res.json();
}

export async function confirmImportAPI(payload) {
  const res = await fetch("http://localhost:5001/api/v1/import/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return await res.json();
}
