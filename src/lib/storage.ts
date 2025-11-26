import fs from "fs";
import path from "path";

type QARecord = {
  id: string;
  departmentId: string;
  departmentName: string;
  fiscalYear: string;
  month: string;
  data: Record<string, string>;
  updatedAt: string;
};

type StorageData = {
  records: QARecord[];
};

const DATA_FILE_PATH = path.join(process.cwd(), "data", "qa-data.json");

// Ensure data directory exists
function ensureDataDirectory() {
  const dir = path.dirname(DATA_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Read data from file
function readData(): StorageData {
  ensureDataDirectory();
  
  if (!fs.existsSync(DATA_FILE_PATH)) {
    const emptyData: StorageData = { records: [] };
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(emptyData, null, 2));
    return emptyData;
  }

  try {
    const content = fs.readFileSync(DATA_FILE_PATH, "utf-8");
    return JSON.parse(content) as StorageData;
  } catch (error) {
    console.error("Error reading data file:", error);
    return { records: [] };
  }
}

// Write data to file
function writeData(data: StorageData): void {
  ensureDataDirectory();
  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));
}

// Save or update a record
export async function saveRecord(
  departmentId: string,
  departmentName: string,
  fiscalYear: string,
  month: string,
  data: Record<string, string>
): Promise<QARecord> {
  const storage = readData();
  const recordId = `${departmentId}-${fiscalYear}-${month}`;
  
  // Find existing record
  const existingIndex = storage.records.findIndex(r => r.id === recordId);
  
  const record: QARecord = {
    id: recordId,
    departmentId,
    departmentName,
    fiscalYear,
    month,
    data,
    updatedAt: new Date().toISOString()
  };
  
  if (existingIndex >= 0) {
    // Update existing record
    storage.records[existingIndex] = record;
  } else {
    // Add new record
    storage.records.push(record);
  }
  
  writeData(storage);
  return record;
}

// Get record by period
export async function getRecordByPeriod(
  departmentId: string,
  fiscalYear: string,
  month: string
): Promise<QARecord | null> {
  const storage = readData();
  const recordId = `${departmentId}-${fiscalYear}-${month}`;
  return storage.records.find(r => r.id === recordId) || null;
}

// Get records by year
export async function getRecordsByYear(
  departmentId: string,
  fiscalYear: string
): Promise<QARecord[]> {
  const storage = readData();
  return storage.records.filter(
    r => r.departmentId === departmentId && r.fiscalYear === fiscalYear
  );
}

// Delete a record
export async function deleteRecord(
  departmentId: string,
  fiscalYear: string,
  month: string
): Promise<boolean> {
  const storage = readData();
  const recordId = `${departmentId}-${fiscalYear}-${month}`;
  
  const initialLength = storage.records.length;
  storage.records = storage.records.filter(r => r.id !== recordId);
  
  if (storage.records.length < initialLength) {
    writeData(storage);
    return true;
  }
  
  return false;
}

// Get all records
export async function getAllRecords(): Promise<QARecord[]> {
  const storage = readData();
  return storage.records;
}

// Get records by department
export async function getRecordsByDepartment(departmentId: string): Promise<QARecord[]> {
  const storage = readData();
  return storage.records.filter(r => r.departmentId === departmentId);
}