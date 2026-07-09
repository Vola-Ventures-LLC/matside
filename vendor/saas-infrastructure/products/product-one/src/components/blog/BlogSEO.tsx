import { useEffect } from "react";

interface BlogSEOProps {
  title: string;
  description: string;
  image?: string;
  url: string;
  publishedAt?: string;
  modifiedAt?: string;
  author?: string;
  type?: "article" | "website";
}

export function BlogSEO({
  title,
  description,
  image,
  url,
  publishedAt,
  modifiedAt,
  author,
  type = "article",
}: BlogSEOProps) {
  useEffect(() => {
    // Update document title
    document.title = `${title} | SaaS Starter`;

    // Update meta tags
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let element = document.querySelector(
        `meta[${attr}="${name}"]`
      ) as HTMLMetaElement;

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // Basic meta
    updateMeta("description", description);

    // Open Graph
    updateMeta("og:title", title, true);
    updateMeta("og:description", description, true);
    updateMeta("og:type", type, true);
    updateMeta("og:url", url, true);
    if (image) updateMeta("og:image", image, true);

    // Twitter
    updateMeta("twitter:card", "summary_large_image");
    updateMeta("twitter:title", title);
    updateMeta("twitter:description", description);
    if (image) updateMeta("twitter:image", image);

    // JSON-LD structured data
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": type === "article" ? "Article" : "WebPage",
      headline: title,
      description,
      image: image || undefined,
      url,
      datePublished: publishedAt,
      dateModified: modifiedAt || publishedAt,
      author: author
        ? {
            "@type": "Person",
            name: author,
          }
        : undefined,
      publisher: {
        "@type": "Organization",
        name: "SaaS Starter",
      },
    };

    let scriptElement = document.querySelector(
      'script[type="application/ld+json"]'
    ) as HTMLScriptElement;

    if (!scriptElement) {
      scriptElement = document.createElement("script");
      scriptElement.type = "application/ld+json";
      document.head.appendChild(scriptElement);
    }
    scriptElement.textContent = JSON.stringify(jsonLd);

    // Cleanup on unmount
    return () => {
      document.title = "SaaS Starter";
    };
  }, [title, description, image, url, publishedAt, modifiedAt, author, type]);

  return null;
}
