import { makeListCreateHandlers } from "@/lib/weeklyAmount/routeHandlers";
import { getTipsCollection } from "@/lib/db/collections";

export const { GET, POST } = makeListCreateHandlers({ getCollection: getTipsCollection });
