import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { generateOpenApiDocument } from "../openapi/registry.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = resolve(root, "openapi/openapi.json");
const doc = generateOpenApiDocument();
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(doc, null, 2));
console.log(`OpenAPI spec written to ${outPath}`);
