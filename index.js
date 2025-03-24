import express from "express";
import dotenv from "dotenv";
import adminRoutes from "./routes/adminRoutes.js";
import path from "path";
import buyerRoutes from "./routes/buyerRoutes.js";

import supplierRoutes from "./routes/supplierRoutes.js";
import transporterRoutes from "./routes/transportRoutes.js";
// import multer from "multer";
dotenv.config();

const app = express();
app.use(express.json());
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "storage/material"))
  
);

// // Set up storage for uploaded images
// const storage = multer.diskStorage({
//   destination: "./uploads/",
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });

// const upload = multer({ storage: storage });

app.use("/admin", adminRoutes);
app.use("/buyer", buyerRoutes);
app.use("/transporter", transporterRoutes);

app.use("/supplier", supplierRoutes);

// app.put("/uploadImages", upload.array("files"), (req, res) => {
//   let images = req.body.images ? JSON.parse(req.body.images) : [];

//   // Process uploaded images
//   if (req.files) {
//     req.files.forEach((file, index) => {
//       let partphotolink = "";
//       if (images[index]) {
//         partphotolink = `/uploads/${file.filename}`;
//       }
//       images[index] = {
//         id: images[index] ? images[index].id : null,
//         image: images[index].network ? "" : partphotolink,
//         isNetwork: images[index].network,
//       };
//     });
//   }

//   res.json({ images });
// });
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
