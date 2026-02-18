import * as XLSX from 'xlsx';
import { VisitData, ProductLine } from '../types';

export const downloadTemplate = () => {
  const headers = [
    {
      "Shop Name": "Example Shop",
      "Location": "Liberty Market",
      "Stock Level (0-100)": 75,
      "Products Available": "Beauty Cream, Soap, Serum",
      "Competitor Activity": "None observed",
      "Notes": "Great display shelf"
    },
    {
      "Shop Name": "City General Store",
      "Location": "DHA Phase 4",
      "Stock Level (0-100)": 20,
      "Products Available": "Face Wash, Bleach",
      "Competitor Activity": "High presence of competitor X",
      "Notes": "Needs urgent restocking"
    }
  ];
  const ws = XLSX.utils.json_to_sheet(headers);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Visit Data Template");
  XLSX.writeFile(wb, "GoldenPearl_Visit_Data_Template.xlsx");
};

export const parseExcel = async (file: File): Promise<VisitData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);

        const parsedVisits: VisitData[] = json.map((row: any, index: number) => {
           // Parse products string to array
           const productString = row["Products Available"] || "";
           const products = productString.split(',').map((p: string) => p.trim()).filter((p: string) => Object.values(ProductLine).includes(p as ProductLine));

           return {
             id: (Date.now() + index).toString(),
             shopName: row["Shop Name"] || "Unknown Shop",
             location: row["Location"] || "Unknown Location",
             timestamp: Date.now(),
             imageUrl: undefined, // Excel upload doesn't support images easily
             notes: row["Notes"] || "",
             competitorActivity: row["Competitor Activity"] || "",
             stockLevel: parseInt(row["Stock Level (0-100)"]) || 0,
             productsAvailable: products as ProductLine[],
             aiInsight: "Imported from Excel"
           };
        });

        resolve(parsedVisits);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};