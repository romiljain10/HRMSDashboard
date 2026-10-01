import { makeUploadHandler } from "@/lib/weeklyAmount/routeHandlers";
import { getTipsCollection } from "@/lib/db/collections";

export const POST = makeUploadHandler({
  getCollection: getTipsCollection,
  amountLabel: "Gratuity Amount ($)",
  sheetName: "Gratuity Data",
});
