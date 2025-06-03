import dotenv from "dotenv";
import { Index } from "@upstash/vector";

dotenv.config();

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

async function main() {
  try {
    const namespaces = await index.listNamespaces();
    console.log(`Namespace count before: ${namespaces.length}`);

    for (const namespace of namespaces) {
      console.log(`Attempting to delete namespace: ${namespace}`);
      try {
        // Try different method signatures
        await index.deleteNamespace(namespace);
      } catch (nsError) {
        console.log(`Failed to delete ${namespace}:`, nsError.message);
        // Try alternative approach - delete all vectors in namespace
        try {
          await index.reset({ namespace });
          console.log(`Reset namespace ${namespace} instead`);
        } catch (resetError) {
          console.log(`Failed to reset ${namespace}:`, resetError.message);
        }
      }
    }

    const namespacesAfter = await index.listNamespaces();
    console.log(`Namespace count after: ${namespacesAfter.length}`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
