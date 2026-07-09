import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface Section {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
}

interface Article {
  id: string;
  section_id: string;
  title: string;
  content: string;
  excerpt: string | null;
  status: string;
  sort_order: number;
}

/** Strip HTML tags and decode entities into plain text */
function htmlToPlainText(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent?.trim() || "";
}

/** Wrap long text into lines that fit within a given page width */
function wrapText(pdf: jsPDF, text: string, maxWidth: number): string[] {
  return pdf.splitTextToSize(text, maxWidth) as string[];
}

export function ExportGuidesPdf() {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setExporting(true);

    try {
      // Fetch all active sections
      const { data: sections, error: secErr } = await supabase
        .from("guide_sections")
        .select("id, title, description, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (secErr) throw secErr;

      // Fetch all published articles
      const { data: articles, error: artErr } = await supabase
        .from("guide_articles")
        .select("id, section_id, title, content, excerpt, status, sort_order")
        .eq("status", "published")
        .order("sort_order", { ascending: true });

      if (artErr) throw artErr;

      if (!sections?.length && !articles?.length) {
        toast({ title: "No published guides to export", variant: "destructive" });
        setExporting(false);
        return;
      }

      // Group articles by section
      const articlesBySection = new Map<string, Article[]>();
      (articles || []).forEach((a) => {
        const list = articlesBySection.get(a.section_id) || [];
        list.push(a as Article);
        articlesBySection.set(a.section_id, list);
      });

      // Build PDF
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const marginLeft = 20;
      const marginRight = 20;
      const contentWidth = pageWidth - marginLeft - marginRight;
      const marginTop = 25;
      const marginBottom = 20;
      let y = marginTop;

      const ensureSpace = (needed: number) => {
        if (y + needed > pageHeight - marginBottom) {
          pdf.addPage();
          y = marginTop;
        }
      };

      // ─── Cover page ───
      pdf.setFontSize(28);
      pdf.setFont("helvetica", "bold");
      const titleLines = wrapText(pdf, "User & Testing Guides", contentWidth);
      y = 80;
      titleLines.forEach((line) => {
        pdf.text(line, pageWidth / 2, y, { align: "center" });
        y += 12;
      });

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(120, 120, 120);
      pdf.text(`Generated ${new Date().toLocaleDateString()}`, pageWidth / 2, y + 10, {
        align: "center",
      });

      pdf.setTextColor(0, 0, 0);

      // ─── Table of Contents ───
      pdf.addPage();
      y = marginTop;
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("Table of Contents", marginLeft, y);
      y += 12;

      let tocIndex = 1;
      (sections || []).forEach((section) => {
        const sectionArticles = articlesBySection.get(section.id) || [];
        if (sectionArticles.length === 0) return;

        ensureSpace(8);
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text(`${tocIndex}. ${section.title}`, marginLeft, y);
        y += 6;

        sectionArticles.forEach((article, aIdx) => {
          ensureSpace(6);
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          pdf.text(`   ${tocIndex}.${aIdx + 1}  ${article.title}`, marginLeft + 4, y);
          y += 5;
        });

        y += 3;
        tocIndex++;
      });

      // ─── Content pages ───
      let sectionIdx = 1;
      (sections || []).forEach((section) => {
        const sectionArticles = articlesBySection.get(section.id) || [];
        if (sectionArticles.length === 0) return;

        // Section header on new page
        pdf.addPage();
        y = marginTop;

        // Section number + title
        pdf.setFontSize(22);
        pdf.setFont("helvetica", "bold");
        const sectionTitle = `${sectionIdx}. ${section.title}`;
        const sectionLines = wrapText(pdf, sectionTitle, contentWidth);
        sectionLines.forEach((line) => {
          pdf.text(line, marginLeft, y);
          y += 10;
        });

        // Section description
        if (section.description) {
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "italic");
          pdf.setTextColor(100, 100, 100);
          const descLines = wrapText(pdf, section.description, contentWidth);
          descLines.forEach((line) => {
            ensureSpace(6);
            pdf.text(line, marginLeft, y);
            y += 5;
          });
          pdf.setTextColor(0, 0, 0);
        }

        y += 6;

        // Articles
        sectionArticles.forEach((article, aIdx) => {
          ensureSpace(20);

          // Divider line between articles
          if (aIdx > 0) {
            pdf.setDrawColor(200, 200, 200);
            pdf.line(marginLeft, y, pageWidth - marginRight, y);
            y += 8;
          }

          // Article title
          pdf.setFontSize(16);
          pdf.setFont("helvetica", "bold");
          const artTitle = `${sectionIdx}.${aIdx + 1}  ${article.title}`;
          const artTitleLines = wrapText(pdf, artTitle, contentWidth);
          artTitleLines.forEach((line) => {
            ensureSpace(8);
            pdf.text(line, marginLeft, y);
            y += 7;
          });

          y += 2;

          // Article body (plain text from HTML)
          const plainContent = htmlToPlainText(article.content);
          if (plainContent) {
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "normal");
            const bodyLines = wrapText(pdf, plainContent, contentWidth);

            bodyLines.forEach((line) => {
              ensureSpace(5);
              pdf.text(line, marginLeft, y);
              y += 4.5;
            });
          }

          y += 8;
        });

        sectionIdx++;
      });

      // ─── Footer page numbers ───
      const totalPages = pdf.getNumberOfPages();
      for (let i = 2; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i - 1} of ${totalPages - 1}`, pageWidth / 2, pageHeight - 10, {
          align: "center",
        });
        pdf.setTextColor(0, 0, 0);
      }

      pdf.save("user-guides.pdf");
      toast({ title: "Guides exported to PDF" });
    } catch (err: any) {
      console.error("PDF export error:", err);
      toast({
        title: "Export failed",
        description: err?.message || "Could not generate PDF",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={exporting} className="gap-2">
      {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {exporting ? "Exporting…" : "Export PDF"}
    </Button>
  );
}
