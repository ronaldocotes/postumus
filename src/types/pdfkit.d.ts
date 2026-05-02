declare module "pdfkit" {
  import { EventEmitter } from "events";

  interface PDFDocumentOptions {
    size?: string | [number, number];
    margins?: { top?: number; bottom?: number; left?: number; right?: number };
    info?: {
      Title?: string;
      Author?: string;
      Subject?: string;
      Keywords?: string;
      Creator?: string;
      Producer?: string;
      CreationDate?: Date;
      ModDate?: Date;
    };
    layout?: "portrait" | "landscape";
    bufferPages?: boolean;
    autoFirstPage?: boolean;
    compress?: boolean;
    pdfVersion?: string;
    lang?: string;
    tagged?: boolean;
  }

  class PDFDocument extends EventEmitter {
    constructor(options?: PDFDocumentOptions);

    // Page methods
    addPage(options?: PDFDocumentOptions): PDFDocument;
    end(): void;

    // Text methods
    text(text: string, x?: number, y?: number, options?: any): PDFDocument;
    font(name: string): PDFDocument;
    fontSize(size: number): PDFDocument;
    fillColor(color: string): PDFDocument;
    strokeColor(color: string): PDFDocument;
    lineWidth(width: number): PDFDocument;
    lineJoin(join: string): PDFDocument;
    lineCap(cap: string): PDFDocument;
    dash(length: number, options?: any): PDFDocument;
    undash(): PDFDocument;
    moveTo(x: number, y: number): PDFDocument;
    lineTo(x: number, y: number): PDFDocument;
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): PDFDocument;
    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): PDFDocument;
    closePath(): PDFDocument;
    stroke(): PDFDocument;
    fill(color?: string): PDFDocument;
    fillAndStroke(fillColor?: string, strokeColor?: string): PDFDocument;
    rect(x: number, y: number, w: number, h: number): PDFDocument;
    roundedRect(x: number, y: number, w: number, h: number, r?: number): PDFDocument;
    ellipse(x: number, y: number, r1: number, r2?: number): PDFDocument;
    circle(x: number, y: number, radius: number): PDFDocument;
    polygon(...points: number[][]): PDFDocument;
    path(path: string): PDFDocument;
    save(): PDFDocument;
    restore(): PDFDocument;
    transform(m11: number, m12: number, m21: number, m22: number, dx: number, dy: number): PDFDocument;
    translate(x: number, y: number): PDFDocument;
    rotate(angle: number, options?: { origin?: [number, number] }): PDFDocument;
    scale(xFactor: number, yFactor?: number, options?: { origin?: [number, number] }): PDFDocument;
    skew(xAngle: number, yAngle?: number, options?: { origin?: [number, number] }): PDFDocument;

    // Image methods
    image(src: string | Buffer, x?: number, y?: number, options?: any): PDFDocument;

    // Utility
    widthOfString(text: string, options?: any): number;
    heightOfString(text: string, options?: any): number;
    currentLineHeight(includeGap?: boolean): number;

    // Properties
    x: number;
    y: number;
    page: any;
  }

  export default PDFDocument;
}
