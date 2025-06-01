import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeWebpage(url: string): Promise<string> {
  try {
    //console.log("Fetching URL:", url);
    const { data } = await axios.get(url);
    //console.log("Fetched data successfully");

    const $ = cheerio.load(data);
    //console.log("Loaded HTML into Cheerio");

    // Remove script and style elements
    $("script, style").remove();
    //console.log("Removed script and style elements");

    // Replace <br> tags with newline characters
    $("br").replaceWith("\n");
    //console.log("Replaced <br> tags with newlines");

    let textContent = "";
    const seenText = new Set<string>();

    // Process elements in the body sequentially
    $("body")
      .children()
      .each((_, elem) => {
        const $elem = $(elem);

        // Ensure the element has a tagName before proceeding
        if ("tagName" in elem && elem.tagName) {
          // Recursively process this element and its children
          const processElement = ($el: cheerio.Cheerio<any>) => {
            // Get direct text content of this element (excluding children)
            const ownText = $el
              .contents()
              .filter((_, node) => node.type === "text")
              .text()
              .trim();

            if (ownText && !seenText.has(ownText)) {
              seenText.add(ownText);
              textContent += ownText + "\n";

              // Add extra newline after paragraphs and headings
              const firstChild = $el.get(0);
              if (firstChild && "tagName" in firstChild && firstChild.tagName) {
                if (
                  ["p", "h1", "h2", "h3", "h4", "h5", "h6"].includes(
                    firstChild.tagName.toLowerCase()
                  )
                ) {
                  textContent += "\n";
                }
              }
            }

            // Process child elements
            $el.children().each((_, child) => {
              processElement($(child));
            });
          };

          processElement($elem);
        }
      });
    //console.log("Extracted unique text content");

    // Clean up multiple newlines and trim
    textContent = textContent
      .replace(/\n{3,}/g, "\n\n") // Reduce triple+ newlines to double
      .trim();

    //console.log("Final text snippet:", textContent.slice(0, 100) + "...");
    return textContent;
  } catch (error) {
    //console.error("Error scraping webpage:", error);
    throw error;
  }
}
