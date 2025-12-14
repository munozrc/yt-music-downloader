/**
 * Capitalizes the first letter of each word in a string
 * Example: "the beatles" → "The Beatles"
 */
export function capitalizeWords(text: string): string {
  return text
    .split(" ")
    .map((word) => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
