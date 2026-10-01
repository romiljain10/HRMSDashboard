import { makeTemplateHandler } from "@/lib/weeklyAmount/routeHandlers";

export const GET = makeTemplateHandler({
  amountLabel: "Bonus Amount",
  sheetName: "Bonus Data",
  exampleRows: [
    { employeeName: "John Smith", amount: 200 },
    { employeeName: "Sam", amount: 150 },
  ],
  fileLabel: "Bonus",
});
