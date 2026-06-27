/**
 * Shared rendering engine for every state's volunteer-hours verification PDF.
 *
 * THIS IS A PRINTING PRESS, NOT A SINGLE FORM. Each state's form is legally
 * distinct — different fields, labels, attestation language, agency, page
 * geometry. This module supplies the shared *primitives* (the helpers every
 * per-state file used to re-declare by hand) so that each state file becomes a
 * thin *config + layout* that drives the same engine. The per-state files keep
 * their own distinct structure; they no longer hand-roll fonts, coordinate
 * helpers, word-wrap, table-fitting, signature blocks, or footers.
 *
 * Coordinate convention: every primitive takes a `top` measured from the TOP of
 * the page (y grows downward), matching the `T(top) = H - top` idiom that every
 * legacy builder already used. Internally we convert to pdf-lib's bottom-origin
 * space. This keeps the migration faithful to the original layouts.
 *
 * Workers-runtime safe: no fs, no template/asset loading — only pdf-lib and the
 * standard fonts.
 */
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb, type RGB } from "pdf-lib";
import type { StateFormData } from "./types";

export type Align = "left" | "center" | "right";

/** Which standard font family a form's body text uses. */
export type FontFamily = "helvetica" | "times";

export interface FormMeta {
  /** PDF metadata title. */
  title: string;
  /** PDF metadata author (agency), optional. */
  author?: string;
  /** Page width in points. Default 612 (US Letter portrait). */
  width?: number;
  /** Page height in points. Default 792. */
  height?: number;
  /** Body font family. Default "helvetica". (NM uses Times.) */
  font?: FontFamily;
}

export interface DrawTextOpts {
  size?: number;
  font?: PDFFont;
  color?: RGB;
  align?: Align;
  /** Right edge used for align="right"/"center". Defaults to the page right edge. */
  maxX?: number;
}

export interface FittedTableSpec {
  /** Left edge of the table. */
  x: number;
  /** Top of the table (header row top). */
  top: number;
  /** Right edge of the table. */
  right: number;
  /**
   * Hard bottom the table must NOT cross. Row heights auto-shrink so the body
   * always fits between `top` and `bottom`. This is the structural fix for the
   * recurring "rows overflow into the band below" bug.
   */
  bottom: number;
  /** Height of the header row. */
  headerHeight: number;
  /** Number of body rows to draw. */
  rows: number;
  /** Column boundary x positions, INCLUDING left (x) and right edges. */
  columns: number[];
  /** Header cell labels (one per column gap). */
  headers: string[];
  /** Optional first-row values (one per column gap); other rows left blank. */
  firstRow?: (string | undefined)[];
  headerSize?: number;
  cellSize?: number;
  /** Shade the header row. Default true. */
  shadeHeader?: boolean;
}

export interface SignatureBlockField {
  label: string;
  /** Prefilled value (e.g. printed rep name / date). Omit to leave blank. */
  value?: string;
  /** Render the value in italic (signature look). Default false. */
  italicValue?: boolean;
}

export interface SignatureBlockSpec {
  /** Top of the bordered block. */
  top: number;
  left: number;
  right: number;
  /** Total block height. Default 30. */
  height?: number;
  /** Cells, left→right. Their widths split the block evenly unless `splits` given. */
  cells: SignatureBlockField[];
  /** Optional explicit divider x positions (between cells). */
  splits?: number[];
  /** Draw an outer border + dividers (boxed) vs. plain underlines. Default true. */
  boxed?: boolean;
}

export interface FooterSpec {
  /** Form-id / agency line (left). */
  left: string;
  /** Optional submission/return note. Wraps; renders right-aligned if `rightAlign`. */
  right?: string;
  /** Font size for the footer. Default 8. */
  size?: number;
  /** Draw a hairline rule above the footer. Default true. */
  rule?: boolean;
  /** Right-align the `right` string on the same baseline as `left`. Default false. */
  rightAlign?: boolean;
}

/** A bound rendering context for one PDF page. */
export interface PageCtx {
  page: PDFPage;
  /** Convert a top-origin coordinate to pdf-lib's bottom-origin y. */
  T(top: number): number;
  /** Draw text at a top-origin baseline. */
  text(value: string, x: number, top: number, opts?: DrawTextOpts): void;
  /** Horizontal rule. */
  line(x1: number, top: number, x2: number, thickness?: number, color?: RGB): void;
  /** Vertical rule between two tops. */
  vline(x: number, top1: number, top2: number, thickness?: number, color?: RGB): void;
  /** Stroked (and optionally filled) rectangle, positioned by its TOP edge. */
  rect(x: number, top: number, width: number, height: number, opts?: { fill?: RGB; border?: RGB; borderWidth?: number }): void;
  /** Inverted section band: dark/grey bar with a label. */
  band(label: string, top: number, opts?: { left?: number; right?: number; fill?: RGB; textColor?: RGB; size?: number; height?: number }): void;
  /** Label + underline + value on one baseline. Returns the value's start x. */
  field(label: string, value: string | undefined, top: number, opts?: { labelX?: number; valX?: number; end?: number; size?: number; labelFont?: PDFFont; valueFont?: PDFFont }): number;
  /** Checkbox + label; fills "X" when checked. */
  checkbox(label: string, x: number, top: number, checked: boolean, opts?: { size?: number; boxSize?: number }): void;
  /** Word-wrap `value` into `maxWidth`; returns the next top after the block. */
  wrap(value: string, x: number, top: number, maxWidth: number, opts?: { size?: number; font?: PDFFont; leading?: number; color?: RGB }): number;
  /** Truncate `value` so it fits `maxWidth` at `size` (no ellipsis). */
  fit(value: string, maxWidth: number, opts?: { size?: number; font?: PDFFont }): string;
  /** Truncate with a trailing ellipsis when clipped. */
  ellipsize(value: string, maxWidth: number, opts?: { size?: number; font?: PDFFont }): string;
  /** Auto-fitting table whose body rows shrink to never cross `spec.bottom`. */
  fittedTable(spec: FittedTableSpec): void;
  /** Bordered/underlined signature row with optional prefilled cells. */
  signatureBlock(spec: SignatureBlockSpec): void;
  /** Page footer with size + address-wrap handling. */
  footer(spec: FooterSpec): void;
}

/** The whole-document context returned by createForm. */
export interface FormCtx extends PageCtx {
  doc: PDFDocument;
  width: number;
  height: number;
  reg: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  /** Default ink color. */
  ink: RGB;
  /** Add another page and return a context bound to it (same fonts/colors). */
  addPage(): PageCtx;
  /** Finalize and return bytes. */
  save(): Promise<Uint8Array>;
}

const DEFAULT_INK = rgb(0.04, 0.04, 0.04);
const DEFAULT_BAND = rgb(0.85, 0.86, 0.86);
const DEFAULT_LINE = rgb(0.45, 0.45, 0.45);

function bindPage(
  page: PDFPage,
  height: number,
  width: number,
  fonts: { reg: PDFFont; bold: PDFFont; italic: PDFFont },
  ink: RGB,
): PageCtx {
  const { reg, bold, italic } = fonts;
  const T = (top: number) => height - top;

  const measure = (value: string, font: PDFFont, size: number) => font.widthOfTextAtSize(value, size);

  const text: PageCtx["text"] = (value, x, top, opts = {}) => {
    const size = opts.size ?? 10;
    const font = opts.font ?? reg;
    const color = opts.color ?? ink;
    let drawX = x;
    if (opts.align === "center") {
      const right = opts.maxX ?? width;
      drawX = x + (right - x - measure(value, font, size)) / 2;
    } else if (opts.align === "right") {
      const right = opts.maxX ?? x;
      drawX = right - measure(value, font, size);
    }
    page.drawText(value, { x: drawX, y: T(top), size, font, color });
  };

  const line: PageCtx["line"] = (x1, top, x2, thickness = 0.6, color = ink) =>
    page.drawLine({ start: { x: x1, y: T(top) }, end: { x: x2, y: T(top) }, thickness, color });

  const vline: PageCtx["vline"] = (x, top1, top2, thickness = 0.6, color = ink) =>
    page.drawLine({ start: { x, y: T(top1) }, end: { x, y: T(top2) }, thickness, color });

  const rect: PageCtx["rect"] = (x, top, w, h, opts = {}) =>
    page.drawRectangle({
      x,
      y: T(top + h),
      width: w,
      height: h,
      borderColor: opts.border ?? (opts.fill && !("border" in opts) ? undefined : ink),
      borderWidth: opts.borderWidth ?? (opts.border === undefined && opts.fill ? 0 : 0.65),
      ...(opts.fill ? { color: opts.fill } : {}),
    });

  const band: PageCtx["band"] = (label, top, opts = {}) => {
    const left = opts.left ?? 56;
    const right = opts.right ?? width - 56;
    const fill = opts.fill ?? DEFAULT_BAND;
    const h = opts.height ?? 18;
    const size = opts.size ?? 11.5;
    page.drawRectangle({ x: left, y: T(top + 14), width: right - left, height: h, color: fill });
    text(label, left + 6, top + 11, { font: bold, size, color: opts.textColor ?? ink });
  };

  const field: PageCtx["field"] = (label, value, top, opts = {}) => {
    const labelX = opts.labelX ?? 70;
    const valX = opts.valX ?? 262;
    const end = opts.end ?? width - 56;
    const size = opts.size ?? 11;
    text(label, labelX, top, { font: opts.labelFont ?? bold, size });
    line(valX, top + 3, end, 0.8, DEFAULT_LINE);
    if (value) text(value, valX + 4, top, { font: opts.valueFont ?? reg, size });
    return valX + 4;
  };

  const checkbox: PageCtx["checkbox"] = (label, x, top, checked, opts = {}) => {
    const s = opts.boxSize ?? 11;
    const size = opts.size ?? 11;
    page.drawRectangle({ x, y: T(top + s - 1), width: s, height: s, borderColor: ink, borderWidth: 1 });
    if (checked) text("X", x + 2.3, top - 0.5, { font: bold, size });
    if (label) text(label, x + s + 7, top, { font: reg, size });
  };

  const wrapLines = (value: string, maxWidth: number, font: PDFFont, size: number): string[] => {
    const words = value.split(/\s+/);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (measure(test, font, size) > maxWidth && cur) {
        lines.push(cur);
        cur = w;
      } else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  };

  const wrap: PageCtx["wrap"] = (value, x, top, maxWidth, opts = {}) => {
    const size = opts.size ?? 10;
    const font = opts.font ?? reg;
    const leading = opts.leading ?? size + 4;
    let y = top;
    for (const ln of wrapLines(value, maxWidth, font, size)) {
      text(ln, x, y, { size, font, color: opts.color });
      y += leading;
    }
    return y;
  };

  const fit: PageCtx["fit"] = (value, maxWidth, opts = {}) => {
    const size = opts.size ?? 10;
    const font = opts.font ?? reg;
    let s = value;
    while (s && measure(s, font, size) > maxWidth) s = s.slice(0, -1);
    return s;
  };

  const ellipsize: PageCtx["ellipsize"] = (value, maxWidth, opts = {}) => {
    const size = opts.size ?? 10;
    const font = opts.font ?? reg;
    if (measure(value, font, size) <= maxWidth) return value;
    let s = value;
    while (s && measure(`${s}…`, font, size) > maxWidth) s = s.slice(0, -1);
    return `${s}…`;
  };

  const fittedTable: PageCtx["fittedTable"] = (spec) => {
    const { x, top, right, bottom, headerHeight, rows, columns, headers } = spec;
    const headerSize = spec.headerSize ?? 9.5;
    const cellSize = spec.cellSize ?? 10;
    // Shrink row height so header + rows never cross `bottom`.
    const available = bottom - top - headerHeight;
    const rowH = rows > 0 ? Math.min(22, available / rows) : 0;
    const tableBottom = top + headerHeight + rowH * rows;
    // Outer box.
    rect(x, top, right - x, tableBottom - top, { border: ink, borderWidth: 0.8 });
    // Header shading.
    if (spec.shadeHeader !== false) {
      page.drawRectangle({ x, y: T(top + headerHeight), width: right - x, height: headerHeight, color: DEFAULT_BAND });
    }
    // Column dividers (interior boundaries only).
    for (const cx of columns.slice(1, -1)) vline(cx, top, tableBottom, 0.6, ink);
    // Horizontal dividers.
    for (let i = 0; i <= rows; i++) line(x, top + headerHeight + rowH * i, right, 0.6, ink);
    // Header labels.
    headers.forEach((h, i) => {
      const cx = columns[i] ?? x;
      text(h, cx + 6, top + headerHeight - 6, { font: bold, size: headerSize });
    });
    // First-row values.
    if (spec.firstRow && rowH > 0) {
      const baseline = top + headerHeight + Math.min(14, rowH - 4);
      spec.firstRow.forEach((v, i) => {
        if (!v) return;
        const cx = columns[i] ?? x;
        const colEnd = columns[i + 1] ?? right;
        text(ellipsize(v, colEnd - cx - 10, { size: cellSize }), cx + 6, baseline, { size: cellSize });
      });
    }
  };

  const signatureBlock: PageCtx["signatureBlock"] = (spec) => {
    const { top, left, right, cells } = spec;
    const h = spec.height ?? 30;
    const boxed = spec.boxed ?? true;
    const splits = spec.splits ?? (() => {
      const out: number[] = [];
      const step = (right - left) / cells.length;
      for (let i = 1; i < cells.length; i++) out.push(left + step * i);
      return out;
    })();
    const labelTop = top + h - 6;
    if (boxed) {
      rect(left, top, right - left, h, { border: ink, borderWidth: 0.8 });
      // Inner rule separating value area (top) from label area (bottom).
      line(left, top + h - 13, right, 0.8, ink);
      for (const sx of splits) vline(sx, top, top + h, 0.8, ink);
    }
    const bounds = [left, ...splits, right];
    cells.forEach((cell, i) => {
      const cx = bounds[i];
      const cxEnd = bounds[i + 1];
      if (!boxed) line(cx, top + h - 13, cxEnd - 12, 0.8, DEFAULT_LINE);
      text(cell.label, cx + 6, labelTop, { font: reg, size: 8.5 });
      if (cell.value) {
        text(cell.value, cx + 10, top + h - 17, {
          font: cell.italicValue ? italic : reg,
          size: cell.italicValue ? 12 : 10,
        });
      }
    });
  };

  const footer: PageCtx["footer"] = (spec) => {
    const size = spec.size ?? 8;
    const leftX = 56;
    const rightEdge = width - 36;
    if (spec.rightAlign && spec.right) {
      // Single baseline near the bottom: form-id left, note right-aligned.
      // The left string is fitted so it can never collide with the note.
      const baseTop = height - 8;
      if (spec.rule) line(leftX, baseTop - 10, rightEdge, 0.6, ink);
      const rightW = measure(spec.right, reg, size);
      text(ellipsize(spec.left, rightEdge - leftX - rightW - 16, { size }), leftX, baseTop, { size });
      text(spec.right, rightEdge, baseTop, { size, align: "right", maxX: rightEdge });
      return;
    }
    // Stacked: rule, then form-id, then (optional) note wrapped below it. The
    // whole block is anchored to the bottom so it never crosses page bounds.
    const noteLines = spec.right ? wrapLines(spec.right, rightEdge - leftX, reg, size) : [];
    const lineGap = size + 2;
    const bottomTop = height - 6;
    const startTop = bottomTop - noteLines.length * lineGap;
    if (spec.rule) line(leftX, startTop - 11, rightEdge, 0.6, ink);
    text(ellipsize(spec.left, rightEdge - leftX, { size }), leftX, startTop, { size });
    let ty = startTop + lineGap;
    for (const ln of noteLines) { text(ln, leftX, ty, { size }); ty += lineGap; }
  };

  return {
    page, T, text, line, vline, rect, band, field, checkbox, wrap, fit, ellipsize,
    fittedTable, signatureBlock, footer,
  };
}

/** Create a new form document + a context bound to its first page. */
export async function createForm(meta: FormMeta): Promise<FormCtx> {
  const width = meta.width ?? 612;
  const height = meta.height ?? 792;
  const doc = await PDFDocument.create();
  doc.setTitle(meta.title);
  if (meta.author) doc.setAuthor(meta.author);
  doc.setProducer("Tended");

  const reg = await doc.embedFont(meta.font === "times" ? StandardFonts.TimesRoman : StandardFonts.Helvetica);
  const bold = await doc.embedFont(meta.font === "times" ? StandardFonts.TimesRomanBold : StandardFonts.HelveticaBold);
  // Italic is reserved for signature-name rendering; Times italic reads as a
  // signature even when the body font is Helvetica.
  const italic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const ink = DEFAULT_INK;

  const fonts = { reg, bold, italic };
  const first = doc.addPage([width, height]);
  const firstCtx = bindPage(first, height, width, fonts, ink);

  return {
    ...firstCtx,
    doc,
    width,
    height,
    reg,
    bold,
    italic,
    ink,
    addPage() {
      const p = doc.addPage([width, height]);
      return bindPage(p, height, width, fonts, ink);
    },
    save: () => doc.save(),
  };
}

/** Shared palette so per-state files don't re-declare the common greys. */
export const palette = {
  ink: DEFAULT_INK,
  band: DEFAULT_BAND,
  lineGrey: DEFAULT_LINE,
  linkBlue: rgb(0.05, 0.32, 0.66),
};

export type { StateFormData };
