require("dotenv").config();
const fs = require("fs");
const path = require("path");
const {getDB} = require("./utils/library");
const postgres = getDB();

async function main() {
  try {
    let sql = fs.readFileSync(
      path.join(__dirname, "utils", "what-up-db.sql"),
      "utf-8"
    );
    console.info(await postgres.query(sql));
    return "DB Setup Complete";
  } catch (e) {
    console.error(e);
    return process.exit(1);
  }
}

main()
  .then(console.log)
  .catch(console.error);
