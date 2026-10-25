import { inventory } from "./m2_catalog_inventory.ts";
import { catalogEntries, validateCatalog } from "../../supabase/functions/family-api/m2-contract.ts";
import { canonicalJson, sha256 } from "../../supabase/functions/family-api/crypto.ts";
const assessments = catalogEntries(await inventory());
validateCatalog(assessments);
if (assessments.length !== 64) throw new Error("Reviewed catalog must contain 64 assessments");
const manifest = { contract_version: 1, catalog_version: 1,
  catalog_digest: await sha256(canonicalJson(assessments)), assessments };
console.log("*** Begin Patch\n*** Add File: supabase/functions/family-api/m2-catalog.json\n" +
  JSON.stringify(manifest, null, 2).split("\n").map(line => "+" + line).join("\n") + "\n*** End Patch");
