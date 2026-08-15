import client from "./client";

export function uploadImages(files) {
  const form = new FormData();
  Array.from(files).forEach((f) => form.append("files", f));
  return client
    .post("/ImageUpload/upload-multiple", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data.imageUrls);
}
