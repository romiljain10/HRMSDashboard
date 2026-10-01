import { makeListCreateHandlers } from "@/lib/weeklyAmount/routeHandlers";
import { getBonusesCollection } from "@/lib/db/collections";

export const { GET, POST } = makeListCreateHandlers({ getCollection: getBonusesCollection });
