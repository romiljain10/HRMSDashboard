import { makeTemplateHandler } from "@/lib/weeklyAmount/routeHandlers";

export const GET = makeTemplateHandler({
  amountLabel: "Tip Amount",
  sheetName: "Gratuity Data",
  exampleRows: [
    { employeeName: "John Smith", amount: 100 },
    { employeeName: "Sam", amount: 50 },
    { employeeName: "Bob", amount: 75 },
  ],
  fileLabel: "Gratuity",
});
