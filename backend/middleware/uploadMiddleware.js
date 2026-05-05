import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, "uploads/");
    },
    filename(req, file, cb) {
        const ext=path.extname(file.originalname);
        
        const sessionId=req.params.id || 'unknown';
        cb(null, `${sessionId}-${Date.now()}${ext}`);
    },
}); 

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("audio/") || file.mimetype === "application/octet-stream") {
        cb(null, true);
    } else {
        cb(new Error("Not an audio file"), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 10 },
});

const uploadSingleAudio = upload.single("audioFile");

const docFileFilter = (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new Error("Not a PDF file"), false);
    }
};

const uploadDoc = multer({
    storage: storage,
    fileFilter: docFileFilter,
    limits: { fileSize: 1024 * 1024 * 10 },
});

const uploadSingleResume = uploadDoc.single("resume");

export { uploadSingleAudio, uploadSingleResume };