import { bambooGetBinary } from "@/lib/bamboohr/client";

export async function GET(request, { params }) {
  const { id } = await params;
  const photo = await bambooGetBinary(`/employees/${id}/photo/small`);

  if (!photo) {
    return new Response(null, { status: 404 });
  }

  return new Response(photo.buffer, {
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
