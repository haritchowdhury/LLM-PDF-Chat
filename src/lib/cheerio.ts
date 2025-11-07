import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeWebpage(url: string): Promise<string> {
  try {
    //console.log("Fetching URL:", url);
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 30000, // 30 second timeout
      maxRedirects: 5, // Follow up to 5 redirects
    });
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

    // Provide better error messages
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 403) {
        throw new Error(`Access denied (403): The website "${url}" is blocking automated access. Try a different URL or check if the site allows scraping.`);
      } else if (error.response?.status === 404) {
        throw new Error(`Page not found (404): The URL "${url}" does not exist.`);
      } else if (error.response?.status) {
        throw new Error(`Failed to fetch URL (${error.response.status}): ${error.message}`);
      } else if (error.code === 'ENOTFOUND') {
        throw new Error(`Invalid URL or DNS error: Cannot reach "${url}"`);
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error(`Timeout: The website "${url}" took too long to respond.`);
      }
    }

    throw new Error(`Failed to scrape webpage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
