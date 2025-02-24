import sqlite3 from "sqlite3";

const sql3 = sqlite3.verbose();

const DB = new sql3.Database(
  "./database.db",
  sql3.OPEN_READWRITE | sql3.OPEN_CREATE,
  connectDB
);

function connectDB(err) {
  if (err) {
    console.log("DB Connection Error:", err);
    return;
  }
  console.log("DB Connected: SQLite");
  initializeDatabase();
}

function initializeDatabase() {
  // Users table
  const usersTable = `CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    credits INTEGER DEFAULT 20,
    last_reset TEXT DEFAULT CURRENT_TIMESTAMP
  )`;

  // Documents table
  const documentsTable = `CREATE TABLE IF NOT EXISTS documents(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    content TEXT NOT NULL,
    upload_date TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`;

  // Credit requests table
  const creditRequestsTable = `CREATE TABLE IF NOT EXISTS credit_requests(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    request_date TEXT DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending',
    amount INTEGER DEFAULT 10,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`;

  // Scan history table
  const scanHistoryTable = `CREATE TABLE IF NOT EXISTS scan_history(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    document_id INTEGER NOT NULL,
    scan_date TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (document_id) REFERENCES documents (id)
  )`;

  // Match results table
  const matchResultsTable = `CREATE TABLE IF NOT EXISTS match_results(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scan_id INTEGER NOT NULL,
    matched_doc_id INTEGER NOT NULL,
    similarity_score REAL NOT NULL,
    FOREIGN KEY (scan_id) REFERENCES scan_history (id),
    FOREIGN KEY (matched_doc_id) REFERENCES documents (id)
  )`;

  // Activity Log table
  const activityLogTable = `CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL,
  metadata TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
  )`;

  DB.run(usersTable, [], (err) => {
    if (err) console.log("Error creating users table:", err);
    else console.log("Users table ready");
  });

  DB.run(documentsTable, [], (err) => {
    if (err) console.log("Error creating documents table:", err);
    else console.log("Documents table ready");
  });

  DB.run(creditRequestsTable, [], (err) => {
    if (err) console.log("Error creating credit_requests table:", err);
    else console.log("Credit requests table ready");
  });

  DB.run(scanHistoryTable, [], (err) => {
    if (err) console.log("Error creating scan_history table:", err);
    else console.log("Scan history table ready");
  });

  DB.run(matchResultsTable, [], (err) => {
    if (err) console.log("Error creating match_results table:", err);
    else console.log("Match results table ready");
  });
  
  DB.run(activityLogTable, [], (err) => {
    if (err) console.log("Error creating activity_logs table:", err);
    else console.log("Activity logs table ready");
  });
}

export default DB;
