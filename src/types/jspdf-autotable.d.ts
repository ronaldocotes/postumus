declare module "jspdf-autotable" {
  import { jsPDF } from "jspdf";

  interface AutoTableOptions {
    head?: (string | number)[][];
    body?: (string | number)[][];
    startY?: number;
    margin?: { left?: number; right?: number; top?: number; bottom?: number };
    styles?: {
      fontSize?: number;
      cellPadding?: number;
      font?: string;
      textColor?: number | number[];
      fillColor?: number | number[];
      lineColor?: number | number[];
      lineWidth?: number;
      halign?: "left" | "center" | "right";
      valign?: "top" | "middle" | "bottom";
    };
    headStyles?: {
      fillColor?: number | number[];
      textColor?: number | number[];
      fontStyle?: string;
      halign?: "left" | "center" | "right";
    };
    alternateRowStyles?: {
      fillColor?: number | number[];
    };
    rowStyles?: {
      [key: number]: { fillColor?: number | number[] };
    };
    didDrawPage?: (data: { pageNumber: number; settings: any }) => void;
  }

  function autoTable(doc: jsPDF, options: AutoTableOptions): void;

  export default autoTable;
}
