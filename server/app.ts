import express from "express";
import cors from "cors";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const PORT = 8080;
const app = express();
//Database object
const database = { data: "", signature: "" };

const PRIVATE_KEY = fs.readFileSync("../private_key.pem", "utf8");
const PUBLIC_KEY = fs.readFileSync("../public_key.pem", "utf8");
const PRIVATE_KEY_PASSPHRASE = "secureData";

// Create a Directory for backups
const BACKUP_DIR = path.join(__dirname, "backups");

app.use(cors());
app.use(express.json());

// To ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR);
}

/*
Function generates a digital signature for a given data string using the SHA-256 hashing 
algorithm and a private key with a passphrase for encryption
*/
const signData = (data: string) => {
  const sign = crypto.createSign("SHA256");
  sign.update(data);
  sign.end();
  return sign.sign(
    { key: PRIVATE_KEY, passphrase: PRIVATE_KEY_PASSPHRASE },
    "base64"
  );
};

/* Encrypts the Data using public key */
const encryptData = (data: string) => {
  const buffer = Buffer.from(data, "utf8");
  const encrypted = crypto.publicEncrypt(PUBLIC_KEY, buffer);
  return encrypted.toString("base64");
};

/* Encrypts the Data using private key */
const decryptData = (encryptedData: string) => {
  const buffer = Buffer.from(encryptedData, "base64");
  const decrypted = crypto.privateDecrypt(
    { key: PRIVATE_KEY, passphrase: PRIVATE_KEY_PASSPHRASE },
    buffer
  );
  return decrypted.toString("utf8");
};

/*
 verifySignature() verifies the authenticity of a data string against a given signature 
 using a public key
*/
const verifySignature = (data: string, signature: string) => {
  const verify = crypto.createVerify("SHA256");
  verify.update(data);
  verify.end();
  return verify.verify(PUBLIC_KEY, signature, "base64");
};

// Routes

app.get("/", (req, res) => {
  const decryptedData = decryptData(database.data);
  res.json({ data: decryptedData });
});

app.post("/", (req, res) => {
  const { data } = req.body;
  const signature = signData(data);
  const encryptedData = encryptData(data);
  if (verifySignature(data, signature)) {
    database.data = encryptedData;
    database.signature = signature;
    // Save a backup
    const backupFile = path.join(BACKUP_DIR, `${Date.now()}.json`);
    fs.writeFileSync(
      backupFile,
      JSON.stringify({ data: encryptedData, signature })
    );

    res.sendStatus(200);
  } else {
    res.status(400).send("Data verification failed.");
  }
});

app.post("/verify", (req, res) => {
  const { data } = req.body;
  const isValid = verifySignature(data, database.signature);
  res.json({ valid: isValid });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
