import { makeUploadHandler } from "@/lib/weeklyAmount/routeHandlers";
import { getBonusesCollection } from "@/lib/db/collections";

export const POST = makeUploadHandler({
  getCollection: getBonusesCollection,
  amountLabel: "Bonus Amount ($)",
  sheetName: "Bonus Data",
});
