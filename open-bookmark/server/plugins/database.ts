import { getDb } from "../utils/db";

export default defineNitroPlugin(() => {
  getDb();
});
